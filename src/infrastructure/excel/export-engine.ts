import { existsSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import * as XLSX from 'xlsx'
import { OUTPUT_SCORE_HEADERS, REQUIRED_INPUT_HEADERS } from '@shared/constants/field-mapping'
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

const SCORE_HEADER_TO_FIELD: Record<(typeof OUTPUT_SCORE_HEADERS)[number], keyof StudentCalculationResult> = {
  坐位体前屈得分: 'sitReachScore',
  '800m得分': 'run800Score',
  '50m得分': 'run50Score',
  立定跳远得分: 'standingJumpScore',
  仰卧起坐得分: 'sitUpScore',
  总成绩: 'totalScore'
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

function formatScoreValue(header: string, result: StudentCalculationResult): string {
  const field = SCORE_HEADER_TO_FIELD[header as keyof typeof SCORE_HEADER_TO_FIELD]
  if (!field) {
    return ''
  }
  const value = result[field]
  if (field === 'totalScore') {
    return roundTotalScore(value as number).toFixed(2)
  }
  return String(value)
}

export function buildExportRows(input: ExportBuildInput): string[][] {
  const resultByRow = new Map<number, StudentCalculationResult>()
  for (const result of input.calculationReport.results) {
    resultByRow.set(result.rowIndex, result)
  }

  const headerRow = [...REQUIRED_INPUT_HEADERS, ...OUTPUT_SCORE_HEADERS]
  const dataRows = input.gridRows.slice(1).map((row, index) => {
    const rowIndex = index + 2
    const result = resultByRow.get(rowIndex)
    const originalCells = REQUIRED_INPUT_HEADERS.map((_, colIndex) => row[colIndex] ?? '')

    if (!result || !result.success) {
      return [...originalCells, ...OUTPUT_SCORE_HEADERS.map(() => '')]
    }

    const scoreCells = OUTPUT_SCORE_HEADERS.map((header) => formatScoreValue(header, result))
    return [...originalCells, ...scoreCells]
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
