import type { ScoreItemCodeValue } from '@shared/constants/score-items'
import { LookupStrategy } from '@shared/constants/score-items'

export interface ItemCalculationTrace {
  readonly itemCode: ScoreItemCodeValue
  readonly itemLabel: string
  readonly rawPerformance: number
  readonly performanceDisplay: string
  readonly strategy: LookupStrategy
  readonly matchedPerformance: number
  readonly matchedPerformanceDisplay: string
  readonly itemScore: number
  readonly weightPercent: number
  readonly weightFactor: number
  readonly contributionScore: number
}

export interface StudentCalculationResult {
  readonly rowIndex: number
  readonly studentNumber: string
  readonly name: string
  readonly sitReachScore: number
  readonly run800Score: number
  readonly run50Score: number
  readonly standingJumpScore: number
  readonly sitUpScore: number
  readonly totalScore: number
  /** 该生五项均为满分时可获得的最高总成绩（等级评定基准） */
  readonly maxPossibleTotalScore: number
  readonly traces: readonly ItemCalculationTrace[]
  readonly success: boolean
  readonly errorMessage?: string
}

export interface CalculationReport {
  readonly startedAt: string
  readonly finishedAt: string
  readonly durationMs: number
  readonly ruleId: string
  readonly ruleName: string
  readonly ruleVersion: string
  readonly totalStudents: number
  readonly successCount: number
  readonly failedCount: number
  readonly results: readonly StudentCalculationResult[]
}

export interface CalculationRequest {
  readonly students: readonly import('./student').Student[]
  readonly rule: import('./score-rule').ScoreRuleObject
}
