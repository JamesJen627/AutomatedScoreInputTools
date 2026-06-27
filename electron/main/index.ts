import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import {
  activateScoreRule,
  exportExcelWithDialog,
  getActiveScoreRule,
  importExcelFile,
  initializeScoreRules,
  listScoreRulePlugins,
  openExcelFileDialog,
  runCalculation
} from '@app'
import { resolveAppPaths, ensureUserDataDirectories, isAppInitialized } from '@infrastructure/storage'
import { APP_NAME, APP_NAME_ZH, APP_VERSION } from '@shared/constants'
import { IpcChannel, type AppInfo, type AppPaths } from '@shared/types'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    title: APP_NAME_ZH,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function buildAppInfo(): AppInfo {
  return {
    name: APP_NAME,
    nameZh: APP_NAME_ZH,
    version: APP_VERSION,
    userDataPath: app.getPath('userData'),
    initialized: isAppInitialized()
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.APP_INITIALIZE, async (): Promise<AppInfo> => {
    await ensureUserDataDirectories()
    const paths = resolveAppPaths()
    initializeScoreRules(paths.scoreRules)
    return buildAppInfo()
  })

  ipcMain.handle(IpcChannel.APP_GET_INFO, (): AppInfo => buildAppInfo())

  ipcMain.handle(IpcChannel.APP_GET_PATHS, (): AppPaths => resolveAppPaths())

  ipcMain.handle(IpcChannel.EXCEL_OPEN_AND_IMPORT, async () => {
    const filePath = await openExcelFileDialog()
    if (!filePath) {
      return null
    }
    return importExcelFile(filePath)
  })

  ipcMain.handle(IpcChannel.EXCEL_IMPORT_FILE, (_event, filePath: string) => {
    return importExcelFile(filePath)
  })

  ipcMain.handle(IpcChannel.RULES_LIST, () => {
    const paths = resolveAppPaths()
    return listScoreRulePlugins(paths.scoreRules)
  })

  ipcMain.handle(IpcChannel.RULES_ACTIVATE, (_event, pluginPath: string) => {
    const rule = activateScoreRule(pluginPath)
    return {
      manifest: rule.manifest,
      pluginPath: rule.pluginPath
    }
  })

  ipcMain.handle(IpcChannel.RULES_GET_ACTIVE, () => {
    const rule = getActiveScoreRule()
    if (!rule) {
      return null
    }
    return {
      manifest: rule.manifest,
      pluginPath: rule.pluginPath
    }
  })

  ipcMain.handle(IpcChannel.CALCULATION_RUN, (_event, students: import('@shared/models').Student[]) => {
    return runCalculation(students)
  })

  ipcMain.handle(IpcChannel.EXPORT_EXCEL, (_event, request: import('@shared/types').ExportExcelRequest) => {
    return exportExcelWithDialog(request)
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
