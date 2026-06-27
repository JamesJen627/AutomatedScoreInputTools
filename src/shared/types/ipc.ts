/** IPC channel names — single source of truth for main/preload/renderer. */

import type { ExcelParseResult } from './import'
import type {
  CalculationReport,
  ScoreRuleManifest,
  ScoreRulePluginInfo,
  Student,
  ValidationIssue
} from '@shared/models'

export const IpcChannel = {
  APP_GET_INFO: 'app:get-info',
  APP_GET_PATHS: 'app:get-paths',
  APP_INITIALIZE: 'app:initialize',
  EXCEL_OPEN_AND_IMPORT: 'excel:open-and-import',
  EXCEL_IMPORT_FILE: 'excel:import-file',
  RULES_LIST: 'rules:list',
  RULES_ACTIVATE: 'rules:activate',
  RULES_GET_ACTIVE: 'rules:get-active',
  CALCULATION_RUN: 'calculation:run'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

export interface AppInfo {
  readonly name: string
  readonly nameZh: string
  readonly version: string
  readonly userDataPath: string
  readonly initialized: boolean
}

export interface AppPaths {
  readonly userData: string
  readonly config: string
  readonly logs: string
  readonly cache: string
  readonly autosave: string
  readonly scoreRules: string
}

export interface ImportSession {
  readonly fileName: string
  readonly filePath: string
  readonly sheetName: string
  readonly students: readonly Student[]
  readonly issues: readonly ValidationIssue[]
  readonly gridRows: readonly (readonly string[])[]
  readonly importedAt: string
  readonly passed: boolean
}

export interface CellFocusTarget {
  readonly rowIndex: number
  readonly columnName: string
}

export interface ActiveScoreRuleInfo {
  readonly manifest: ScoreRuleManifest
  readonly pluginPath: string
}

export interface CalculationRunResult {
  readonly report: CalculationReport
  readonly auditPassed: boolean
}

export interface AsitApi {
  getAppInfo: () => Promise<AppInfo>
  getAppPaths: () => Promise<AppPaths>
  initializeApp: () => Promise<AppInfo>
  openAndImportExcel: () => Promise<ExcelParseResult | null>
  importExcelFile: (filePath: string) => Promise<ExcelParseResult>
  listScoreRulePlugins: () => Promise<ScoreRulePluginInfo[]>
  activateScoreRule: (pluginPath: string) => Promise<ActiveScoreRuleInfo>
  getActiveScoreRule: () => Promise<ActiveScoreRuleInfo | null>
  runCalculation: (students: readonly Student[]) => Promise<CalculationRunResult>
}

declare global {
  interface Window {
    asit: AsitApi
  }
}

export {}
