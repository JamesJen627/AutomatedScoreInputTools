import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import {
  buildDefaultExportFileName,
  buildExportRows,
  exportCalculationExcel,
  resolveAvailableExportPath
} from '@infrastructure/excel'
import { OUTPUT_SCORE_HEADERS, REQUIRED_INPUT_HEADERS } from '@shared/constants/field-mapping'
import type { CalculationReport, StudentCalculationResult } from '@shared/models'

function buildGridRows(): string[][] {
  const header = [...REQUIRED_INPUT_HEADERS]
  const row = header.map((_, index) => {
    const values = [
      '高一(1)班',
      'E001',
      'S001',
      '张三',
      '女',
      '19',
      '20',
      '3:18',
      '20',
      '7.56',
      '20',
      '2.26',
      '20',
      '48',
      '20'
    ]
    return values[index] ?? ''
  })
  return [header, row]
}

function buildCalculationReport(): CalculationReport {
  const result: StudentCalculationResult = {
    rowIndex: 2,
    studentNumber: 'S001',
    name: '张三',
    sitReachScore: 95,
    run800Score: 90,
    run50Score: 88,
    standingJumpScore: 92,
    sitUpScore: 85,
    totalScore: 90.0,
    traces: [],
    success: true
  }

  return {
    startedAt: '2025-01-01T00:00:00.000Z',
    finishedAt: '2025-01-01T00:00:01.000Z',
    durationMs: 1000,
    ruleId: 'test.rule',
    ruleName: '测试标准',
    ruleVersion: '1.0.0',
    totalStudents: 1,
    successCount: 1,
    failedCount: 0,
    results: [result]
  }
}

describe('export-engine', () => {
  it('默认导出文件名追加 _已计算 后缀', () => {
    expect(buildDefaultExportFileName('成绩表.xlsx')).toBe('成绩表_已计算.xlsx')
  })

  it('buildExportRows 追加得分列', () => {
    const rows = buildExportRows({
      gridRows: buildGridRows(),
      calculationReport: buildCalculationReport()
    })

    expect(rows[0]).toEqual([...REQUIRED_INPUT_HEADERS, ...OUTPUT_SCORE_HEADERS])
    expect(rows[1]).toHaveLength(REQUIRED_INPUT_HEADERS.length + OUTPUT_SCORE_HEADERS.length)
    expect(rows[1]?.[REQUIRED_INPUT_HEADERS.length]).toBe('95')
    expect(rows[1]?.[REQUIRED_INPUT_HEADERS.length + OUTPUT_SCORE_HEADERS.length - 1]).toBe('90.00')
  })

  it('resolveAvailableExportPath 在文件已存在时递增序号', () => {
    const directory = mkdtempSync(join(tmpdir(), 'asit-export-'))
    try {
      const first = resolveAvailableExportPath(directory, '成绩表_已计算.xlsx')
      writeFileSync(first, 'placeholder')
      const second = resolveAvailableExportPath(directory, '成绩表_已计算.xlsx')

      expect(first).not.toBe(second)
      expect(second).toContain('成绩表_已计算(1).xlsx')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('exportCalculationExcel 写入可读取的 xlsx', () => {
    const directory = mkdtempSync(join(tmpdir(), 'asit-export-'))
    try {
      const result = exportCalculationExcel({
        gridRows: buildGridRows(),
        calculationReport: buildCalculationReport(),
        sourceFileName: '成绩表.xlsx',
        outputDirectory: directory
      })

      expect(result.success).toBe(true)
      expect(result.fileName).toBe('成绩表_已计算.xlsx')

      const buffer = readFileSync(result.filePath)
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0] ?? 'Sheet1']
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
      expect(data[0]).toContain('总成绩')
      expect(data[1]?.[REQUIRED_INPUT_HEADERS.length + OUTPUT_SCORE_HEADERS.length - 1]).toBe('90.00')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
