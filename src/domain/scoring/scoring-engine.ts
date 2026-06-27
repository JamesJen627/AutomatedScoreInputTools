import {
  ALL_SCORE_ITEM_CODES,
  ITEM_LOOKUP_STRATEGIES,
  ScoreItemCode,
  type ScoreItemCodeValue
} from '@shared/constants/score-items'
import type {
  CalculationReport,
  ItemCalculationTrace,
  ScoreItemRule,
  ScoreRuleObject,
  Student,
  StudentCalculationResult
} from '@shared/models'
import { formatSecondsToTime } from '@shared/utils'
import {
  getStudentPerformance,
  getStudentWeight,
  lookupScore,
  normalizeWeightFactor,
  roundTotalScore,
  SCORE_ITEM_LABELS
} from './lookup-strategy'

function formatPerformance(itemCode: ScoreItemCodeValue, value: number): string {
  if (itemCode === ScoreItemCode.RUN_800) {
    return formatSecondsToTime(value)
  }
  if (itemCode === ScoreItemCode.SIT_UP) {
    return String(Math.round(value))
  }
  return String(value)
}

function findItemRule(
  rule: ScoreRuleObject,
  itemCode: ScoreItemCodeValue,
  gender: Student['gender']
): ScoreItemRule | undefined {
  return rule.items.find((item) => item.itemCode === itemCode && item.gender === gender)
}

function calculateItemTrace(
  student: Student,
  rule: ScoreRuleObject,
  itemCode: ScoreItemCodeValue
): ItemCalculationTrace | null {
  const itemRule = findItemRule(rule, itemCode, student.gender)
  if (!itemRule) {
    return null
  }

  const rawPerformance = getStudentPerformance(student, itemCode)
  const weightPercent = getStudentWeight(student, itemCode)
  const strategy = ITEM_LOOKUP_STRATEGIES[itemCode]
  const lookup = lookupScore(itemRule.entries, rawPerformance, strategy)
  const weightFactor = normalizeWeightFactor(weightPercent)
  const contributionScore = roundTotalScore(lookup.score * weightFactor)

  return {
    itemCode,
    itemLabel: SCORE_ITEM_LABELS[itemCode],
    rawPerformance,
    performanceDisplay: formatPerformance(itemCode, rawPerformance),
    strategy,
    matchedPerformance: lookup.matchedPerformance,
    matchedPerformanceDisplay: formatPerformance(itemCode, lookup.matchedPerformance),
    itemScore: lookup.score,
    weightPercent,
    weightFactor,
    contributionScore
  }
}

export class ScoringEngine {
  calculateStudent(student: Student, rule: ScoreRuleObject): StudentCalculationResult {
    const traces: ItemCalculationTrace[] = []

    for (const itemCode of ALL_SCORE_ITEM_CODES) {
      const trace = calculateItemTrace(student, rule, itemCode)
      if (!trace) {
        return {
          rowIndex: student.rowIndex,
          studentNumber: student.studentNumber,
          name: student.name,
          sitReachScore: 0,
          run800Score: 0,
          run50Score: 0,
          standingJumpScore: 0,
          sitUpScore: 0,
          totalScore: 0,
          traces: [],
          success: false,
          errorMessage: `缺少评分标准：${SCORE_ITEM_LABELS[itemCode]}（${student.gender}）`
        }
      }
      traces.push(trace)
    }

    const sitReachScore = traces.find((t) => t.itemCode === ScoreItemCode.SIT_REACH)?.itemScore ?? 0
    const run800Score = traces.find((t) => t.itemCode === ScoreItemCode.RUN_800)?.itemScore ?? 0
    const run50Score = traces.find((t) => t.itemCode === ScoreItemCode.RUN_50)?.itemScore ?? 0
    const standingJumpScore = traces.find((t) => t.itemCode === ScoreItemCode.STANDING_JUMP)?.itemScore ?? 0
    const sitUpScore = traces.find((t) => t.itemCode === ScoreItemCode.SIT_UP)?.itemScore ?? 0
    const totalScore = roundTotalScore(traces.reduce((sum, trace) => sum + trace.contributionScore, 0))

    return {
      rowIndex: student.rowIndex,
      studentNumber: student.studentNumber,
      name: student.name,
      sitReachScore,
      run800Score,
      run50Score,
      standingJumpScore,
      sitUpScore,
      totalScore,
      traces,
      success: true
    }
  }

  calculateBatch(students: readonly Student[], rule: ScoreRuleObject): CalculationReport {
    const startedAt = new Date()
    const results: StudentCalculationResult[] = []

    for (const student of students) {
      results.push(this.calculateStudent(student, rule))
    }

    const finishedAt = new Date()
    const successCount = results.filter((result) => result.success).length

    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      ruleId: rule.manifest.id,
      ruleName: rule.manifest.name,
      ruleVersion: rule.manifest.version,
      totalStudents: students.length,
      successCount,
      failedCount: students.length - successCount,
      results
    }
  }
}

export const scoringEngine = new ScoringEngine()

/** 二次计算审核 — PRD §3.16 */
export function compareCalculationReports(
  first: CalculationReport,
  second: CalculationReport
): boolean {
  if (first.results.length !== second.results.length) {
    return false
  }

  for (let i = 0; i < first.results.length; i += 1) {
    const a = first.results[i]
    const b = second.results[i]
    if (
      a.totalScore !== b.totalScore ||
      a.sitReachScore !== b.sitReachScore ||
      a.run800Score !== b.run800Score ||
      a.run50Score !== b.run50Score ||
      a.standingJumpScore !== b.standingJumpScore ||
      a.sitUpScore !== b.sitUpScore
    ) {
      return false
    }
  }

  return true
}
