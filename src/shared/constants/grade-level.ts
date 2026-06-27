/** 初中年级 — 对应成绩单项评分表列组 */
export const GRADE_LEVELS = ['初一', '初二', '初三'] as const

export type GradeLevel = (typeof GRADE_LEVELS)[number]

const GRADE_LEVEL_ALIASES: Readonly<Record<string, GradeLevel>> = {
  七年级: '初一',
  八年级: '初二',
  九年级: '初三'
}

/**
 * 从班级名称推断年级，用于匹配评分表。
 * 例：701 → 初一；高二(1)班含「初一」→ 初一
 */
export function resolveGradeLevelFromClassName(className: string): GradeLevel {
  const trimmed = className.trim()
  if (trimmed.length === 0) {
    return '初二'
  }

  for (const grade of GRADE_LEVELS) {
    if (trimmed.includes(grade)) {
      return grade
    }
  }

  const alias = GRADE_LEVEL_ALIASES[trimmed]
  if (alias) {
    return alias
  }

  const leadingDigits = trimmed.match(/^(\d+)/)?.[1]
  if (leadingDigits && leadingDigits.length >= 1) {
    const gradeDigit = leadingDigits[0]
    if (gradeDigit === '7') {
      return '初一'
    }
    if (gradeDigit === '8') {
      return '初二'
    }
    if (gradeDigit === '9') {
      return '初三'
    }
  }

  return '初二'
}
