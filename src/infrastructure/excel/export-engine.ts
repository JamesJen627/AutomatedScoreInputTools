import { existsSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import * as XLSX from 'xlsx'
import {
  EXPORT_COLUMN_BINDINGS,
  EXPORT_OUTPUT_HEADERS,
  REQUIRED_INPUT_HEADERS
} from '@shared/constants/field-mapping'
import { formatItemScore } from '@shared/constants/score-items'
import { classifyTotalScoreGrade } from '@domain/scoring/total-score-grade'
import { roundTotalScore } from '@domain/scoring/lookup-strategy'
import type { CalculationReport, StudentCalculationResult } from '@shared/models'

export interface ExportBuildInput {
  readonly gridRows: readonly (readonly string[])[]
  readonly calculationReport: CalculationReport
}

export interface ExportWriteInput extends ExportBuildInput {
  readonly sourceFileName: string
  readonly outputDirectory: string
}

export interface ExportResult {
  readonly success: true
  readonly filePath: string
  readonly fileName: string
  readonly rowCount: number
}

type ScoreField =
  | 'sitReachScore'
  | 'run800Score'
  | 'run50Score'
  | 'standingJumpScore'
  | 'sitUpScore'
  | 'totalScore'

function formatScoreValue(field: ScoreField, result: StudentCalculationResult): string {
  const value = result[field]
  if (field === 'totalScore') {
    return roundTotalScore(value).toFixed(2)
  }
  return formatItemScore(value)
}

function buildInputValueMap(row: readonly string[]): Map<string, string> {
  const values = new Map<string, string>()
  REQUIRED_INPUT_HEADERS.forEach((header, index) => {
    values.set(header, String(row[index] ?? '').trim())
  })
  return values
}

function buildExportDataRow(
  inputValues: Map<string, string>,
  result: StudentCalculationResult | undefined
): string[] {
  return EXPORT_COLUMN_BINDINGS.map((binding) => {
    if (binding.kind === 'input') {
      return inputValues.get(binding.inputHeader) ?? ''
    }

    if (binding.kind === 'grade') {
      if (!result || !result.success) {
        return ''
      }
      return classifyTotalScoreGrade(result.totalScore, result.maxPossibleTotalScore)
    }

    if (!result || !result.success) {
      return ''
    }

    return formatScoreValue(binding.scoreField, result)
  })
}

export function buildDefaultExportFileName(sourceFileName: string): string {
  const ext = extname(sourceFileName)
  const base = ext.length > 0 ? basename(sourceFileName, ext) : sourceFileName
  return `${base}_已计算.xlsx`
}

export function resolveAvailableExportPath(directory: string, fileName: string): string {
  const ext = extname(fileName)
  const base = ext.length > 0 ? basename(fileName, ext) : fileName
  const suffix = ext || '.xlsx'

  let candidate = join(directory, `${base}${suffix}`)
  if (!existsSync(candidate)) {
    return candidate
  }

  let index = 1
  while (index < 1000) {
    candidate = join(directory, `${base}(${index})${suffix}`)
    if (!existsSync(candidate)) {
      return candidate
    }
    index += 1
  }

  throw new Error('无法生成唯一导出文件名')
}

export function buildExportRows(input: ExportBuildInput): string[][] {
  const resultByRow = new Map<number, StudentCalculationResult>()
  for (const result of input.calculationReport.results) {
    resultByRow.set(result.rowIndex, result)
  }

  const headerRow = [...EXPORT_OUTPUT_HEADERS]
  const dataRows = input.gridRows.slice(1).map((row, index) => {
    const rowIndex = index + 2
    const result = resultByRow.get(rowIndex)
    const inputValues = buildInputValueMap(row)
    return buildExportDataRow(inputValues, result)
  })

  return [headerRow, ...dataRows]
}

export function writeExportWorkbook(filePath: string, rows: readonly (readonly string[])[]): void {
  const sheet = XLSX.utils.aoa_to_sheet(rows as string[][])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  writeFileSync(filePath, XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

export function exportCalculationExcel(input: ExportWriteInput): ExportResult {
  const rows = buildExportRows(input)
  const fileName = buildDefaultExportFileName(input.sourceFileName)
  const filePath = resolveAvailableExportPath(input.outputDirectory, fileName)
  writeExportWorkbook(filePath, rows)

  return {
    success: true,
    filePath,
    fileName: basename(filePath),
    rowCount: rows.length - 1
  }
}
