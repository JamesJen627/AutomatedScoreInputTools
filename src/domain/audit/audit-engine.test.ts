import { describe, expect, it } from 'vitest'
import { auditCalculationReports } from '@domain/audit/audit-engine'
import type { CalculationReport, StudentCalculationResult } from '@shared/models'

function buildStudentResult(overrides: Partial<StudentCalculationResult> = {}): StudentCalculationResult {
  return {
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
    success: true,
    ...overrides
  }
}

function buildReport(results: readonly StudentCalculationResult[]): CalculationReport {
  const successCount = results.filter((r) => r.success).length
  return {
    startedAt: '2025-01-01T00:00:00.000Z',
    finishedAt: '2025-01-01T00:00:01.000Z',
    durationMs: 1000,
    ruleId: 'test.rule',
    ruleName: '测试标准',
    ruleVersion: '1.0.0',
    totalStudents: results.length,
    successCount,
    failedCount: results.length - successCount,
    results
  }
}

describe('auditCalculationReports', () => {
  it('两次完全一致时审核通过', () => {
    const results = [buildStudentResult()]
    const first = buildReport(results)
    const second = buildReport(results)

    const audit = auditCalculationReports(first, second)
    expect(audit.auditPassed).toBe(true)
    expect(audit.differenceCount).toBe(0)
    expect(audit.differences).toHaveLength(0)
  })

  it('得分字段不一致时记录差异', () => {
    const first = buildReport([buildStudentResult({ totalScore: 90.0 })])
    const second = buildReport([buildStudentResult({ totalScore: 91.0 })])

    const audit = auditCalculationReports(first, second)
    expect(audit.auditPassed).toBe(false)
    expect(audit.differences.some((d) => d.field === 'totalScore')).toBe(true)
    expect(audit.differences[0]?.reason).toContain('总成绩')
  })

  it('结果数量不一致时审核失败', () => {
    const first = buildReport([buildStudentResult()])
    const second = buildReport([
      buildStudentResult(),
      buildStudentResult({ rowIndex: 3, studentNumber: 'S002', name: '李四' })
    ])

    const audit = auditCalculationReports(first, second)
    expect(audit.auditPassed).toBe(false)
    expect(audit.differences[0]?.field).toBe('count')
  })

  it('成功状态不一致时记录差异', () => {
    const first = buildReport([buildStudentResult({ success: true })])
    const second = buildReport([buildStudentResult({ success: false, errorMessage: '失败' })])

    const audit = auditCalculationReports(first, second)
    expect(audit.auditPassed).toBe(false)
    expect(audit.differences.some((d) => d.field === 'success')).toBe(true)
  })
})
