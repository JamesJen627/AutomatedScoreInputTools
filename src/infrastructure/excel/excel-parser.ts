import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import * as XLSX from 'xlsx'
import { ErrorCode } from '@shared/constants'
import { normalizeGridRows, validateGridRows } from '@app/dataset-service'
import { rawExcelRowsToGrid } from '@shared/utils'
import { ValidationLevel, type ValidationIssue } from '@shared/models'
import type { ExcelParseFailure, ExcelParseResult } from '@shared/types/import'

function readRowsFromSheet(sheet: XLSX.WorkSheet): string[][] {
  const ref = sheet['!ref']
  if (!ref) {
    return []
  }
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: ''
  }) as string[][]
  return rows.map((row) => row.map((cell) => String(cell ?? '').trim()))
}

export class ExcelParser {
  parseFile(filePath: string): ExcelParseResult {
    const fileName = basename(filePath)
    const fail = (issues: ValidationIssue[]): ExcelParseFailure => ({
      success: false,
      fileName,
      filePath,
      issues
    })

    let workbook: XLSX.WorkBook
    try {
      const buffer = readFileSync(filePath)
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch {
      return fail([
        {
          rowIndex: 0,
          columnName: fileName,
          level: ValidationLevel.Error,
          errorCode: ErrorCode.EXCEL_FILE_CORRUPT,
          message: 'Excel 文件无法解析',
          suggestion: '请确认文件未损坏且格式为 .xlsx 或 .xls'
        }
      ])
    }

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return fail([
        {
          rowIndex: 0,
          columnName: '-',
          level: ValidationLevel.Error,
          errorCode: ErrorCode.EXCEL_FILE_CORRUPT,
          message: '当前工作表没有数据',
          suggestion: '请确认 Excel 至少包含一个有效工作表'
        }
      ])
    }

    const rawRows = readRowsFromSheet(workbook.Sheets[sheetName])
    const gridRows = normalizeGridRows(rawExcelRowsToGrid(rawRows))
    const validation = validateGridRows(gridRows)

    if (rawRows.length === 0) {
      return fail([...validation.issues])
    }

    return {
      success: true,
      fileName,
      filePath,
      sheetName,
      students: validation.students,
      issues: validation.issues,
      report: validation.report,
      gridRows,
      importedAt: new Date().toISOString()
    }
  }
}

export const excelParser = new ExcelParser()
