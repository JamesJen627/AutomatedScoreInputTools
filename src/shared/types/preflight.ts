import type { ScoreRuleManifest } from '@shared/models/score-rule'
import type { ValidationIssue } from '@shared/models'

export interface PreflightCheckItem {
  readonly id: string
  readonly label: string
  readonly passed: boolean
  readonly level: 'error' | 'warning' | 'success'
  readonly message: string
}

export interface PreflightReport {
  readonly passed: boolean
  readonly errorCount: number
  readonly warningCount: number
  readonly items: readonly PreflightCheckItem[]
  readonly canCalculate: boolean
  readonly studentCount: number
  readonly scoreRuleName: string
  readonly estimatedDurationMs: number
}

export interface PreflightActiveRule {
  readonly manifest: ScoreRuleManifest
}

export interface PreflightInput {
  readonly studentCount: number
  readonly validationIssues: readonly ValidationIssue[]
  readonly activeScoreRule: PreflightActiveRule | null
  readonly isDirty: boolean
}
