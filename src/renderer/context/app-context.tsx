import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { validateGridRows } from '@app/dataset-service'
import type { CalculationReport, ScoreRulePluginInfo, Student, ValidationIssue } from '@shared/models'
import { ValidationLevel } from '@shared/models'
import type {
  ActiveScoreRuleInfo,
  AppInfo,
  AppPaths,
  CellFocusTarget,
  ExcelParseResult,
  ImportSession
} from '@shared/types'
import {
  DEFAULT_STATUS_BAR,
  WorkflowState,
  type StatusBarState
} from '@shared/types/app-state'

const MAX_UNDO_HISTORY = 50

export interface AppContextValue {
  readonly appInfo: AppInfo | null
  readonly appPaths: AppPaths | null
  readonly workflowState: WorkflowState
  readonly statusBar: StatusBarState
  readonly currentFileName: string
  readonly importSession: ImportSession | null
  readonly validationIssues: readonly ValidationIssue[]
  readonly students: readonly Student[]
  readonly gridRows: readonly (readonly string[])[] | null
  readonly isDirty: boolean
  readonly focusTarget: CellFocusTarget | null
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly sidebarCollapsed: boolean
  readonly rightPanelCollapsed: boolean
  readonly initError: string | null
  readonly isInitializing: boolean
  readonly isImporting: boolean
  readonly importError: string | null
  readonly scoreRulePlugins: readonly ScoreRulePluginInfo[]
  readonly activeScoreRule: ActiveScoreRuleInfo | null
  readonly calculationReport: CalculationReport | null
  readonly auditPassed: boolean | null
  readonly isCalculating: boolean
  readonly calculationError: string | null
  readonly selectedTraceRowIndex: number | null
  setWorkflowState: (state: WorkflowState) => void
  setCurrentFileName: (name: string) => void
  setStatusBar: (patch: Partial<StatusBarState>) => void
  toggleSidebar: () => void
  toggleRightPanel: () => void
  importExcel: () => Promise<ExcelParseResult | null>
  applyParseResult: (result: ExcelParseResult) => void
  updateGridRows: (rows: readonly (readonly string[])[], options?: { recordHistory?: boolean }) => void
  markSaved: () => void
  focusIssue: (issue: ValidationIssue) => void
  clearFocusTarget: () => void
  undo: () => void
  redo: () => void
  refreshScoreRules: () => Promise<void>
  activateScoreRule: (pluginPath: string) => Promise<void>
  runCalculation: () => Promise<void>
  setSelectedTraceRowIndex: (rowIndex: number | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function buildImportSession(result: ExcelParseResult): ImportSession | null {
  if (!result.success) {
    return null
  }
  return {
    fileName: result.fileName,
    filePath: result.filePath,
    sheetName: result.sheetName,
    students: result.students,
    issues: result.issues,
    gridRows: result.gridRows,
    importedAt: result.importedAt,
    passed: result.report.passed
  }
}

function cloneGridRows(rows: readonly (readonly string[])[]): string[][] {
  return rows.map((row) => [...row])
}

export function AppProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [appPaths, setAppPaths] = useState<AppPaths | null>(null)
  const [workflowState, setWorkflowState] = useState<WorkflowState>(WorkflowState.Home)
  const [statusBar, setStatusBarState] = useState<StatusBarState>(DEFAULT_STATUS_BAR)
  const [currentFileName, setCurrentFileName] = useState('未打开文件')
  const [importSession, setImportSession] = useState<ImportSession | null>(null)
  const [validationIssues, setValidationIssues] = useState<readonly ValidationIssue[]>([])
  const [students, setStudents] = useState<readonly Student[]>([])
  const [gridRows, setGridRows] = useState<readonly (readonly string[])[] | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [focusTarget, setFocusTarget] = useState<CellFocusTarget | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [scoreRulePlugins, setScoreRulePlugins] = useState<readonly ScoreRulePluginInfo[]>([])
  const [activeScoreRule, setActiveScoreRule] = useState<ActiveScoreRuleInfo | null>(null)
  const [calculationReport, setCalculationReport] = useState<CalculationReport | null>(null)
  const [auditPassed, setAuditPassed] = useState<boolean | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [selectedTraceRowIndex, setSelectedTraceRowIndex] = useState<number | null>(null)

  const historyRef = useRef<string[][][]>([])
  const historyIndexRef = useRef(-1)
  const [historyVersion, setHistoryVersion] = useState(0)

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        const info = await window.asit.initializeApp()
        const paths = await window.asit.getAppPaths()
        setAppInfo(info)
        setAppPaths(paths)
        setInitError(null)
        const activeRule = await window.asit.getActiveScoreRule()
        const plugins = await window.asit.listScoreRulePlugins()
        setActiveScoreRule(activeRule)
        setScoreRulePlugins(plugins)
        if (activeRule) {
          setStatusBarState((prev) => ({
            ...prev,
            scoreRuleName: `${activeRule.manifest.name} v${activeRule.manifest.version}`
          }))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '应用初始化失败'
        setInitError(message)
      } finally {
        setIsInitializing(false)
      }
    }

    void initialize()
  }, [])

  const setStatusBar = useCallback((patch: Partial<StatusBarState>): void => {
    setStatusBarState((prev) => ({ ...prev, ...patch }))
  }, [])

  const applyValidation = useCallback(
    (
      _rows: readonly (readonly string[])[],
      issues: readonly ValidationIssue[],
      nextStudents: readonly Student[],
      _passed: boolean
    ): void => {
      const errorCount = issues.filter((i) => i.level === ValidationLevel.Error).length
      const warningCount = issues.filter((i) => i.level === ValidationLevel.Warning).length

      setStudents(nextStudents)
      setValidationIssues(issues)
      setStatusBar({
        totalRecords: nextStudents.length,
        errorCount,
        warningCount,
        dataStatus: errorCount === 0 ? '已检查' : '检查失败'
      })
      setWorkflowState(errorCount === 0 ? WorkflowState.CheckPassed : WorkflowState.Editing)
    },
    [setStatusBar]
  )

  const pushHistorySnapshot = useCallback((rows: readonly (readonly string[])[]): void => {
    const snapshot = cloneGridRows(rows)
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1)
    trimmed.push(snapshot)
    if (trimmed.length > MAX_UNDO_HISTORY) {
      trimmed.shift()
      historyIndexRef.current = Math.max(0, historyIndexRef.current - 1)
    }
    historyRef.current = trimmed
    historyIndexRef.current = trimmed.length - 1
    setHistoryVersion((v) => v + 1)
  }, [])

  const applyParseResult = useCallback(
    (result: ExcelParseResult): void => {
      setImportError(null)
      setCurrentFileName(result.fileName)

      if (!result.success) {
        setImportSession(null)
        setGridRows(null)
        setStudents([])
        setValidationIssues(result.issues)
        setIsDirty(false)
        historyRef.current = []
        historyIndexRef.current = -1
        setHistoryVersion((v) => v + 1)
        applyValidation([], result.issues, [], false)
        setWorkflowState(WorkflowState.CheckFailed)
        return
      }

      const session = buildImportSession(result)
      setImportSession(session)
      setGridRows(result.gridRows)
      setIsDirty(false)
      historyRef.current = [cloneGridRows(result.gridRows)]
      historyIndexRef.current = 0
      setHistoryVersion((v) => v + 1)
      applyValidation(result.gridRows, result.issues, result.students, result.report.passed)
    },
    [applyValidation]
  )

  const updateGridRows = useCallback(
    (rows: readonly (readonly string[])[], options?: { recordHistory?: boolean }): void => {
      const validation = validateGridRows(rows)
      setGridRows(rows)
      setIsDirty(true)
      setImportSession((prev) =>
        prev
          ? {
              ...prev,
              students: validation.students,
              issues: validation.issues,
              gridRows: rows,
              passed: validation.passed
            }
          : prev
      )
      applyValidation(rows, validation.issues, validation.students, validation.passed)

      if (options?.recordHistory) {
        pushHistorySnapshot(rows)
      }
    },
    [applyValidation, pushHistorySnapshot]
  )

  const importExcel = useCallback(async (): Promise<ExcelParseResult | null> => {
    setIsImporting(true)
    setImportError(null)
    setWorkflowState(WorkflowState.Importing)

    try {
      const result = await window.asit.openAndImportExcel()
      if (!result) {
        setWorkflowState(gridRows ? WorkflowState.Editing : WorkflowState.Home)
        return null
      }
      applyParseResult(result)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入失败'
      setImportError(message)
      setWorkflowState(WorkflowState.CheckFailed)
      return null
    } finally {
      setIsImporting(false)
    }
  }, [applyParseResult, gridRows])

  const markSaved = useCallback((): void => {
    setIsDirty(false)
  }, [])

  const focusIssue = useCallback((issue: ValidationIssue): void => {
    setFocusTarget({ rowIndex: issue.rowIndex, columnName: issue.columnName })
    setStatusBar({
      currentSelection: `第 ${issue.rowIndex} 行，${issue.columnName}`
    })
  }, [setStatusBar])

  const clearFocusTarget = useCallback((): void => {
    setFocusTarget(null)
  }, [])

  const restoreGridSnapshot = useCallback(
    (snapshot: string[][]): void => {
      const validation = validateGridRows(snapshot)
      setGridRows(snapshot)
      setIsDirty(true)
      setImportSession((prev) =>
        prev
          ? {
              ...prev,
              students: validation.students,
              issues: validation.issues,
              gridRows: snapshot,
              passed: validation.passed
            }
          : prev
      )
      applyValidation(snapshot, validation.issues, validation.students, validation.passed)
    },
    [applyValidation]
  )

  const undo = useCallback((): void => {
    if (historyIndexRef.current <= 0) {
      return
    }
    historyIndexRef.current -= 1
    const snapshot = historyRef.current[historyIndexRef.current]
    if (!snapshot) {
      return
    }
    setHistoryVersion((v) => v + 1)
    restoreGridSnapshot(snapshot)
  }, [restoreGridSnapshot])

  const redo = useCallback((): void => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return
    }
    historyIndexRef.current += 1
    const snapshot = historyRef.current[historyIndexRef.current]
    if (!snapshot) {
      return
    }
    setHistoryVersion((v) => v + 1)
    restoreGridSnapshot(snapshot)
  }, [restoreGridSnapshot])

  const toggleSidebar = useCallback((): void => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  const toggleRightPanel = useCallback((): void => {
    setRightPanelCollapsed((prev) => !prev)
  }, [])

  const refreshScoreRules = useCallback(async (): Promise<void> => {
    const plugins = await window.asit.listScoreRulePlugins()
    const activeRule = await window.asit.getActiveScoreRule()
    setScoreRulePlugins(plugins)
    setActiveScoreRule(activeRule)
    if (activeRule) {
      setStatusBar({
        scoreRuleName: `${activeRule.manifest.name} v${activeRule.manifest.version}`
      })
    }
  }, [setStatusBar])

  const activateScoreRule = useCallback(
    async (pluginPath: string): Promise<void> => {
      const rule = await window.asit.activateScoreRule(pluginPath)
      setActiveScoreRule(rule)
      setCalculationReport(null)
      setAuditPassed(null)
      setStatusBar({
        scoreRuleName: `${rule.manifest.name} v${rule.manifest.version}`,
        calculationStatus: '未开始',
        auditStatus: '未开始'
      })
      await refreshScoreRules()
    },
    [refreshScoreRules, setStatusBar]
  )

  const runCalculation = useCallback(async (): Promise<void> => {
    if (students.length === 0) {
      setCalculationError('没有可计算的学生数据')
      return
    }

    setIsCalculating(true)
    setCalculationError(null)
    setWorkflowState(WorkflowState.Calculating)

    try {
      const { report, auditPassed: passed } = await window.asit.runCalculation(students)
      setCalculationReport(report)
      setAuditPassed(passed)
      setStatusBar({
        calculationStatus: '已完成',
        auditStatus: passed ? '审核通过' : '审核失败'
      })
      setWorkflowState(passed ? WorkflowState.ReadyToExport : WorkflowState.AuditComplete)
    } catch (error) {
      const message = error instanceof Error ? error.message : '计算失败'
      setCalculationError(message)
      setWorkflowState(WorkflowState.WaitingCalculation)
    } finally {
      setIsCalculating(false)
    }
  }, [setStatusBar, students])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1 && historyRef.current.length > 0

  const value = useMemo<AppContextValue>(
    () => ({
      appInfo,
      appPaths,
      workflowState,
      statusBar,
      currentFileName,
      importSession,
      validationIssues,
      students,
      gridRows,
      isDirty,
      focusTarget,
      canUndo,
      canRedo,
      sidebarCollapsed,
      rightPanelCollapsed,
      initError,
      isInitializing,
      isImporting,
      importError,
      scoreRulePlugins,
      activeScoreRule,
      calculationReport,
      auditPassed,
      isCalculating,
      calculationError,
      selectedTraceRowIndex,
      setWorkflowState,
      setCurrentFileName,
      setStatusBar,
      toggleSidebar,
      toggleRightPanel,
      importExcel,
      applyParseResult,
      updateGridRows,
      markSaved,
      focusIssue,
      clearFocusTarget,
      undo,
      redo,
      refreshScoreRules,
      activateScoreRule,
      runCalculation,
      setSelectedTraceRowIndex
    }),
    [
      appInfo,
      appPaths,
      workflowState,
      statusBar,
      currentFileName,
      importSession,
      validationIssues,
      students,
      gridRows,
      isDirty,
      focusTarget,
      canUndo,
      canRedo,
      sidebarCollapsed,
      rightPanelCollapsed,
      initError,
      isInitializing,
      isImporting,
      importError,
      scoreRulePlugins,
      activeScoreRule,
      calculationReport,
      auditPassed,
      isCalculating,
      calculationError,
      selectedTraceRowIndex,
      historyVersion,
      setStatusBar,
      toggleSidebar,
      toggleRightPanel,
      importExcel,
      applyParseResult,
      updateGridRows,
      markSaved,
      focusIssue,
      clearFocusTarget,
      undo,
      redo,
      refreshScoreRules,
      activateScoreRule,
      runCalculation
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
