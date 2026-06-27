import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { normalizeGridRows, validateGridRows } from '@app/dataset-service'
import { loadScoreRulePlugin } from '@domain/rules/rule-parser'
import { scoringEngine } from '@domain/scoring/scoring-engine'
import { rawExcelRowsToGrid } from '@shared/utils/grid-utils'

function readTestXlsxRows(): string[][] {
  const buffer = readFileSync(join(process.cwd(), 'docs/测试.xlsx'))
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? '']
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: ''
  }) as string[][]
  return rows.map((row) => row.map((cell) => String(cell ?? '').trim()))
}

describe('docs/测试.xlsx end-to-end', () => {
  it('导入映射后应能解析成绩并计算非零得分', () => {
    const rawRows = readTestXlsxRows()
    const gridRows = normalizeGridRows(rawExcelRowsToGrid(rawRows))
    const validation = validateGridRows(gridRows)

    expect(validation.students.length).toBeGreaterThan(0)
    expect(validation.passed).toBe(true)

    const loaded = loadScoreRulePlugin(join(process.cwd(), 'ScoreRules/2025'))
    expect(loaded.rule).toBeDefined()

    const student = validation.students[0]
    expect(student).toBeDefined()

    const result = scoringEngine.calculateStudent(student!, loaded.rule!)
    expect(result.success).toBe(true)
    expect(result.totalScore).toBeGreaterThan(0)
  })
})
