import type { Gender } from './gender'
import type { ScoreItemCodeValue } from '@shared/constants/score-items'

export interface ScoreRuleManifest {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly author: string
  readonly supportGender: readonly Gender[]
  readonly supportedItems: readonly ScoreItemCodeValue[]
}

export interface ScoreRuleEntry {
  readonly performance: number
  readonly score: number
}

export interface ScoreItemRule {
  readonly itemCode: ScoreItemCodeValue
  readonly gender: Gender
  readonly entries: readonly ScoreRuleEntry[]
}

export interface ScoreRuleObject {
  readonly manifest: ScoreRuleManifest
  readonly pluginPath: string
  readonly items: readonly ScoreItemRule[]
}

export interface ScoreRulePluginInfo {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly pluginPath: string
  readonly isActive: boolean
  readonly isValid: boolean
  readonly errorMessage?: string
}

export interface RuleValidationIssue {
  readonly rowIndex: number
  readonly message: string
}
