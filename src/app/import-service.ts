import { dialog } from 'electron'
import { excelParser } from '@infrastructure/excel'
import type { ExcelParseResult } from '@shared/types'

export async function openExcelFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: '选择成绩 Excel 文件',
    properties: ['openFile'],
    filters: [
      { name: 'Excel 文件', extensions: ['xlsx', 'xls'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

export function importExcelFile(filePath: string): ExcelParseResult {
  return excelParser.parseFile(filePath)
}
