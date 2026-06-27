import type { AuditDifference, AuditReport } from '@shared/models/audit-result'
import type { CalculationReport, StudentCalculationResult } from '@shared/models'

export const AUDIT_SCORE_FIELDS = [
  'sitReachScore',
  'run800Score',
  'run50Score',
  'standingJumpScore',
  'sitUpScore',
  'totalScore'
] as const

export type AuditScoreField = (typeof AUDIT_SCORE_FIELDS)[number]

export const AUDIT_SCORE_FIELD_LABELS: Record<AuditScoreField, string> = {
  sitReachScore: '坐位体前屈得分',
  run800Score: '800m得分',
  run50Score: '50m得分',
  standingJumpScore: '立定跳远得分',
  sitUpScore: '仰卧起坐得分',
  totalScore: '总成绩'
}

export type { AuditDifference, AuditReport }

function compareStudentResults(
  first: StudentCalculationResult,
  second: StudentCalculationResult
): AuditDifference[] {
  const differences: AuditDifference[] = []

  for (const field of AUDIT_SCORE_FIELDS) {
    const firstValue = first[field]
    const secondValue = second[field]
    if (firstValue !== secondValue) {
      differences.push({
        rowIndex: first.rowIndex,
        studentNumber: first.studentNumber,
        name: first.name,
        field,
        fieldLabel: AUDIT_SCORE_FIELD_LABELS[field],
        firstValue,
        secondValue,
        reason: `${AUDIT_SCORE_FIELD_LABELS[field]}不一致：${firstValue} ≠ ${secondValue}`
      })
    }
  }

  if (first.success !== second.success) {
    differences.push({
      rowIndex: first.rowIndex,
      studentNumber: first.studentNumber,
      name: first.name,
      field: 'success',
      fieldLabel: '计算状态',
      firstValue: first.success ? 1 : 0,
      secondValue: second.success ? 1 : 0,
      reason: '两次计算的成功状态不一致'
    })
  }

  return differences
}

export function auditCalculationReports(
  first: CalculationReport,
  second: CalculationReport
): AuditReport {
  const differences: AuditDifference[] = []

  if (first.results.length !== second.results.length) {
    return {
      auditPassed: false,
      checkedAt: new Date().toISOString(),
      totalStudents: first.totalStudents,
      differenceCount: 1,
      differences: [
        {
          rowIndex: 0,
          studentNumber: '-',
          name: '-',
          field: 'count',
          fieldLabel: '记录数',
          firstValue: first.results.length,
          secondValue: second.results.length,
          reason: `学生结果数量不一致：${first.results.length} ≠ ${second.results.length}`
        }
      ]
    }
  }

  for (let i = 0; i < first.results.length; i += 1) {
    differences.push(...compareStudentResults(first.results[i], second.results[i]))
  }

  return {
    auditPassed: differences.length === 0,
    checkedAt: new Date().toISOString(),
    totalStudents: first.totalStudents,
    differenceCount: differences.length,
    differences
  }
}

export function compareCalculationReports(first: CalculationReport, second: CalculationReport): boolean {
  return auditCalculationReports(first, second).auditPassed
}
