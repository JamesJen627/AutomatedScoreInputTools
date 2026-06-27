/** Workflow page identifiers aligned with PRD navigation. */

export const AppRoute = {
  HOME: '/',
  IMPORT: '/import',
  EDITOR: '/editor',
  CALCULATION: '/calculation',
  SCORE_RULES: '/score-rules',
  LOGS: '/logs',
  SETTINGS: '/settings',
  ABOUT: '/about'
} as const

export type AppRoutePath = (typeof AppRoute)[keyof typeof AppRoute]

export interface NavItem {
  readonly path: AppRoutePath
  readonly label: string
  readonly icon: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: AppRoute.HOME, label: '首页', icon: 'home' },
  { path: AppRoute.IMPORT, label: '导入成绩', icon: 'import' },
  { path: AppRoute.CALCULATION, label: '成绩计算', icon: 'calc' },
  { path: AppRoute.SCORE_RULES, label: '评分标准', icon: 'rules' },
  { path: AppRoute.LOGS, label: '日志', icon: 'logs' },
  { path: AppRoute.SETTINGS, label: '设置', icon: 'settings' },
  { path: AppRoute.ABOUT, label: '关于', icon: 'about' }
] as const

/** Unique workflow state — only one active at a time (PRD §2.7). */
export enum WorkflowState {
  Home = 'home',
  Importing = 'importing',
  Checking = 'checking',
  CheckFailed = 'check_failed',
  Editing = 'editing',
  Rechecking = 'rechecking',
  CheckPassed = 'check_passed',
  WaitingCalculation = 'waiting_calculation',
  Calculating = 'calculating',
  Auditing = 'auditing',
  AuditComplete = 'audit_complete',
  ReadyToExport = 'ready_to_export'
}

export interface StatusBarState {
  readonly scoreRuleName: string
  readonly dataStatus: string
  readonly calculationStatus: string
  readonly auditStatus: string
  readonly autoSaveEnabled: boolean
  readonly currentSelection: string
  readonly totalRecords: number
  readonly errorCount: number
  readonly warningCount: number
}

export const DEFAULT_STATUS_BAR: StatusBarState = {
  scoreRuleName: '未加载',
  dataStatus: '未导入',
  calculationStatus: '未开始',
  auditStatus: '未开始',
  autoSaveEnabled: true,
  currentSelection: '-',
  totalRecords: 0,
  errorCount: 0,
  warningCount: 0
}
