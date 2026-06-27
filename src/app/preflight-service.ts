import { ValidationLevel } from '@shared/models'
import type { PreflightCheckItem, PreflightInput, PreflightReport } from '@shared/types/preflight'

export type { PreflightCheckItem, PreflightInput, PreflightReport }

export function runPreflightCheck(input: PreflightInput): PreflightReport {
  const items: PreflightCheckItem[] = []

  const scoreRulePassed = input.activeScoreRule !== null
  items.push({
    id: 'score-rule',
    label: '评分标准',
    passed: scoreRulePassed,
    level: scoreRulePassed ? 'success' : 'error',
    message: scoreRulePassed
      ? `${input.activeScoreRule?.manifest.name} v${input.activeScoreRule?.manifest.version}`
      : '未加载评分标准'
  })

  const dataPassed = input.studentCount > 0
  items.push({
    id: 'student-data',
    label: 'Excel 数据',
    passed: dataPassed,
    level: dataPassed ? 'success' : 'error',
    message: dataPassed ? `共 ${input.studentCount} 名学生` : '未导入学生数据'
  })

  const errorIssues = input.validationIssues.filter((i) => i.level === ValidationLevel.Error)
  const formatPassed = errorIssues.length === 0
  items.push({
    id: 'data-format',
    label: '数据格式',
    passed: formatPassed,
    level: formatPassed ? 'success' : 'error',
    message: formatPassed ? '检查通过' : `存在 ${errorIssues.length} 个错误`
  })

  if (input.isDirty) {
    items.push({
      id: 'unsaved',
      label: '保存状态',
      passed: true,
      level: 'warning',
      message: '当前数据尚未保存，计算将基于最新编辑内容'
    })
  }

  const warningIssues = input.validationIssues.filter((i) => i.level === ValidationLevel.Warning)
  if (warningIssues.length > 0) {
    items.push({
      id: 'warnings',
      label: '警告项',
      passed: true,
      level: 'warning',
      message: `存在 ${warningIssues.length} 项警告，允许继续计算`
    })
  }

  const errorCount = items.filter((item) => item.level === 'error' && !item.passed).length
  const warningCount = items.filter((item) => item.level === 'warning').length
  const passed = errorCount === 0 && scoreRulePassed && dataPassed && formatPassed

  return {
    passed,
    errorCount,
    warningCount,
    items,
    canCalculate: passed,
    studentCount: input.studentCount,
    scoreRuleName: input.activeScoreRule?.manifest.name ?? '未加载',
    estimatedDurationMs: Math.max(500, Math.ceil(input.studentCount * 2))
  }
}
