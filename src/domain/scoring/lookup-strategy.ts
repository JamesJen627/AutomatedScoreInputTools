import { LookupStrategy, type ScoreItemCodeValue } from '@shared/constants/score-items'
import type { ScoreRuleEntry } from '@shared/models'

export interface LookupResult {
  readonly score: number
  readonly matchedPerformance: number
  readonly boundary: 'normal' | 'above_best' | 'below_worst'
}

/**
 * Floor Rule 查表 — PRD §3.7.
 * HigherIsBetter: 取 performance <= student 的最大档位
 * LowerIsBetter: 取 performance >= student 的最小档位
 */
export function lookupScore(
  entries: readonly ScoreRuleEntry[],
  studentValue: number,
  strategy: LookupStrategy
): LookupResult {
  if (entries.length === 0) {
    return { score: 0, matchedPerformance: studentValue, boundary: 'below_worst' }
  }

  const sorted =
    strategy === LookupStrategy.HigherIsBetter
      ? [...entries].sort((a, b) => b.performance - a.performance)
      : [...entries].sort((a, b) => a.performance - b.performance)

  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  if (strategy === LookupStrategy.HigherIsBetter) {
    if (studentValue >= best.performance) {
      return { score: best.score, matchedPerformance: best.performance, boundary: 'above_best' }
    }
    if (studentValue < worst.performance) {
      return { score: worst.score, matchedPerformance: worst.performance, boundary: 'below_worst' }
    }
    const matched = sorted.find((entry) => entry.performance <= studentValue) ?? worst
    return { score: matched.score, matchedPerformance: matched.performance, boundary: 'normal' }
  }

  if (studentValue <= best.performance) {
    return { score: best.score, matchedPerformance: best.performance, boundary: 'above_best' }
  }
  if (studentValue > worst.performance) {
    return { score: worst.score, matchedPerformance: worst.performance, boundary: 'below_worst' }
  }
  const matched = sorted.find((entry) => entry.performance >= studentValue) ?? worst
  return { score: matched.score, matchedPerformance: matched.performance, boundary: 'normal' }
}

export function normalizeWeightFactor(weightPercent: number): number {
  if (weightPercent > 1) {
    return weightPercent / 100
  }
  return weightPercent
}

export function roundTotalScore(value: number): number {
  return Math.round(value * 100) / 100
}

export function getStudentPerformance(student: import('@shared/models').Student, itemCode: ScoreItemCodeValue): number {
  switch (itemCode) {
    case 'sitReach':
      return student.sitReach
    case 'run800':
      return student.run800
    case 'run50':
      return student.run50
    case 'standingJump':
      return student.standingJump
    case 'sitUp':
      return student.sitUp
    default:
      return Number.NaN
  }
}

export function getStudentWeight(student: import('@shared/models').Student, itemCode: ScoreItemCodeValue): number {
  switch (itemCode) {
    case 'sitReach':
      return student.sitReachWeight
    case 'run800':
      return student.run800Weight
    case 'run50':
      return student.run50Weight
    case 'standingJump':
      return student.standingJumpWeight
    case 'sitUp':
      return student.sitUpWeight
    default:
      return Number.NaN
  }
}

export const SCORE_ITEM_LABELS: Record<ScoreItemCodeValue, string> = {
  sitReach: '坐位体前屈',
  run800: '800m',
  run50: '50m',
  standingJump: '立定跳远',
  sitUp: '仰卧起坐'
}
