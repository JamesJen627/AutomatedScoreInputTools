import { ALL_SCORE_ITEM_CODES } from '@shared/constants/score-items'
import type { Student } from '@shared/models'
import {
  getStudentWeight,
  normalizeWeightFactor,
  roundTotalScore
} from './lookup-strategy'

/** 单项满分 */
const MAX_ITEM_SCORE = 100

const GRADE_RATIO_EXCELLENT = 0.9
const GRADE_RATIO_GOOD = 0.8
const GRADE_RATIO_PASS = 0.6

export type TotalScoreGrade = '优' | '良' | '合' | '不合格'

/**
 * 该生五项均为满分 100 时可获得的最高总成绩（= Σ 100 × 占比）。
 */
export function computeMaxPossibleTotalScore(student: Student): number {
  let maxTotal = 0
  for (const itemCode of ALL_SCORE_ITEM_CODES) {
    const weightFactor = normalizeWeightFactor(getStudentWeight(student, itemCode))
    maxTotal += MAX_ITEM_SCORE * weightFactor
  }
  return roundTotalScore(maxTotal)
}

/**
 * 以该生最高可获总成绩为满分判定等级：
 * 优 ≥90%；良 ≥80% 且 <90%；合 ≥60% 且 <80%；不合格 <60%
 */
export function classifyTotalScoreGrade(
  totalScore: number,
  maxPossibleTotalScore: number
): TotalScoreGrade {
  const fullMark = roundTotalScore(maxPossibleTotalScore)
  const score = roundTotalScore(totalScore)

  if (fullMark <= 0) {
    return '不合格'
  }

  if (score >= roundTotalScore(fullMark * GRADE_RATIO_EXCELLENT)) {
    return '优'
  }
  if (score >= roundTotalScore(fullMark * GRADE_RATIO_GOOD)) {
    return '良'
  }
  if (score >= roundTotalScore(fullMark * GRADE_RATIO_PASS)) {
    return '合'
  }
  return '不合格'
}
