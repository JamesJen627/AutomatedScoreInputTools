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
import { EXPORT_OUTPUT_HEADERS, EXPORT_TOTAL_SCORE_GRADE_HEADER } from '@shared/constants/field-mapping'
import type { CalculationReport, StudentCalculationResult } from '@shared/models'

function buildGridRows(): string[][] {
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
  return [
    [
      '班级',
      '考号',
      '学号',
      '姓名',
      '性别',
      '坐位体前屈成绩（单位：厘米）',
      '坐位体前屈得分占比',
      '800m成绩（单位：分·秒）',
      '800m得分占比',
      '50m成绩（单位：秒）',
      '50m得分占比',
      '立定跳远成绩（单位：米）',
      '立定跳远得分占比',
      '仰卧起坐成绩（单位：次）',
      '仰卧起坐得分占比'
    ],
    values
  ]
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
    maxPossibleTotalScore: 100,
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

  it('buildExportRows 按 00_DEMAND 交错列布局输出', () => {
    const rows = buildExportRows({
      gridRows: buildGridRows(),
      calculationReport: buildCalculationReport()
    })

    expect(rows[0]).toEqual(EXPORT_OUTPUT_HEADERS)
    expect(rows[0]).toEqual([
      '班级',
      '考号',
      '学号',
      '姓名',
      '性别',
      '坐位体前屈成绩（单位：厘米）',
      '坐位体前屈得分',
      '坐位体前屈得分占比',
      '800m成绩（单位：分·秒）',
      '800m得分',
      '800m得分占比',
      '50m成绩（单位：秒）',
      '50m得分',
      '50m得分占比',
      '立定跳远成绩（单位：米）',
      '立定跳远得分',
      '立定跳远得分占比',
      '仰卧起坐成绩',
      '仰卧起坐得分',
      '仰卧起坐得分占比',
      '总成绩',
      EXPORT_TOTAL_SCORE_GRADE_HEADER
    ])
    expect(rows[1]).toHaveLength(22)
    expect(rows[1]?.[6]).toBe('95')
    expect(rows[1]?.[9]).toBe('90')
    expect(rows[1]?.[12]).toBe('88')
    expect(rows[1]?.[15]).toBe('92')
    expect(rows[1]?.[18]).toBe('85')
    expect(rows[1]?.[20]).toBe('90.00')
    expect(rows[1]?.[21]).toBe('优')
  })

  it('总成绩低于满分的 60% 时等级为不合格', () => {
    const report = buildCalculationReport()
    const lowScoreReport: CalculationReport = {
      ...report,
      results: [{ ...report.results[0], totalScore: 55, maxPossibleTotalScore: 100 }]
    }
    const rows = buildExportRows({
      gridRows: buildGridRows(),
      calculationReport: lowScoreReport
    })
    expect(rows[1]?.[21]).toBe('不合格')
  })

  it('以该生最高可获总成绩为满分评定等级', () => {
    const report = buildCalculationReport()
    const weightedReport: CalculationReport = {
      ...report,
      results: [{ ...report.results[0], totalScore: 63, maxPossibleTotalScore: 70 }]
    }
    const rows = buildExportRows({
      gridRows: buildGridRows(),
      calculationReport: weightedReport
    })
    expect(rows[1]?.[21]).toBe('优')
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
      expect(data[0]?.[6]).toBe('坐位体前屈得分')
      expect(data[0]?.[20]).toBe('总成绩')
      expect(data[0]?.[21]).toBe(EXPORT_TOTAL_SCORE_GRADE_HEADER)
      expect(data[1]?.[20]).toBe('90.00')
      expect(data[1]?.[21]).toBe('优')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
