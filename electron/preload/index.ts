import { contextBridge, ipcRenderer } from 'electron'
import {
  IpcChannel,
  type ActiveScoreRuleInfo,
  type AppInfo,
  type AppPaths,
  type AsitApi,
  type CalculationRunResult,
  type ExportExcelRequest,
  type ExportResultPayload,
  type ExcelParseResult
} from '@shared/types'
import type { ScoreRulePluginInfo, Student } from '@shared/models'

const asitApi: AsitApi = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke(IpcChannel.APP_GET_INFO),
  getAppPaths: (): Promise<AppPaths> => ipcRenderer.invoke(IpcChannel.APP_GET_PATHS),
  initializeApp: (): Promise<AppInfo> => ipcRenderer.invoke(IpcChannel.APP_INITIALIZE),
  openAndImportExcel: (): Promise<ExcelParseResult | null> =>
    ipcRenderer.invoke(IpcChannel.EXCEL_OPEN_AND_IMPORT),
  importExcelFile: (filePath: string): Promise<ExcelParseResult> =>
    ipcRenderer.invoke(IpcChannel.EXCEL_IMPORT_FILE, filePath),
  listScoreRulePlugins: (): Promise<ScoreRulePluginInfo[]> =>
    ipcRenderer.invoke(IpcChannel.RULES_LIST),
  activateScoreRule: (pluginPath: string): Promise<ActiveScoreRuleInfo> =>
    ipcRenderer.invoke(IpcChannel.RULES_ACTIVATE, pluginPath),
  getActiveScoreRule: (): Promise<ActiveScoreRuleInfo | null> =>
    ipcRenderer.invoke(IpcChannel.RULES_GET_ACTIVE),
  runCalculation: (students: readonly Student[]): Promise<CalculationRunResult> =>
    ipcRenderer.invoke(IpcChannel.CALCULATION_RUN, students),
  exportExcel: (request: ExportExcelRequest): Promise<ExportResultPayload | null> =>
    ipcRenderer.invoke(IpcChannel.EXPORT_EXCEL, request)
}

contextBridge.exposeInMainWorld('asit', asitApi)
