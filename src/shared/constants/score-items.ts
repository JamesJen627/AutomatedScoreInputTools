/** 评分项目系统编码 — PRD §7.7 */

export const ScoreItemCode = {
  SIT_REACH: 'sitReach',
  RUN_800: 'run800',
  RUN_50: 'run50',
  STANDING_JUMP: 'standingJump',
  SIT_UP: 'sitUp'
} as const

export type ScoreItemCodeValue = (typeof ScoreItemCode)[keyof typeof ScoreItemCode]

export const ALL_SCORE_ITEM_CODES: readonly ScoreItemCodeValue[] = [
  ScoreItemCode.SIT_REACH,
  ScoreItemCode.RUN_800,
  ScoreItemCode.RUN_50,
  ScoreItemCode.STANDING_JUMP,
  ScoreItemCode.SIT_UP
]

export enum LookupStrategy {
  HigherIsBetter = 'higher_is_better',
  LowerIsBetter = 'lower_is_better'
}

export const ITEM_LOOKUP_STRATEGIES: Record<ScoreItemCodeValue, LookupStrategy> = {
  [ScoreItemCode.SIT_REACH]: LookupStrategy.HigherIsBetter,
  [ScoreItemCode.RUN_800]: LookupStrategy.LowerIsBetter,
  [ScoreItemCode.RUN_50]: LookupStrategy.LowerIsBetter,
  [ScoreItemCode.STANDING_JUMP]: LookupStrategy.HigherIsBetter,
  [ScoreItemCode.SIT_UP]: LookupStrategy.HigherIsBetter
}

/** Excel 项目名称别名 → 系统编码 */
export const SCORE_ITEM_ALIASES: Record<string, ScoreItemCodeValue> = {
  坐位体前屈: ScoreItemCode.SIT_REACH,
  '800m': ScoreItemCode.RUN_800,
  '800米': ScoreItemCode.RUN_800,
  耐力跑: ScoreItemCode.RUN_800,
  '50m': ScoreItemCode.RUN_50,
  '50米': ScoreItemCode.RUN_50,
  立定跳远: ScoreItemCode.STANDING_JUMP,
  仰卧起坐: ScoreItemCode.SIT_UP
}

export function resolveScoreItemCode(projectName: string): ScoreItemCodeValue | undefined {
  const normalized = projectName.trim()
  return SCORE_ITEM_ALIASES[normalized]
}

export const RULE_EXCEL_HEADERS = ['项目', '性别', '年级', '成绩', '得分'] as const

/** 旧版四列格式（无年级列）兼容 */
export const LEGACY_RULE_EXCEL_HEADERS = ['项目', '性别', '成绩', '得分'] as const

/**
 * 成绩单项评分表规定的单项得分档位（共 20 档）。
 * 查表结果必须命中其中之一，不得插值或四舍五入为其他值。
 */
export const STANDARD_ITEM_SCORE_TIERS = [
  100, 95, 90, 85, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 50, 40, 30, 20, 10
] as const

export type StandardItemScoreTier = (typeof STANDARD_ITEM_SCORE_TIERS)[number]

const STANDARD_ITEM_SCORE_SET = new Set<number>(STANDARD_ITEM_SCORE_TIERS)

/** 单项得分是否为评分表标准档位 */
export function isStandardItemScore(score: number): boolean {
  return STANDARD_ITEM_SCORE_SET.has(score)
}

/** 单项得分展示（标准档位为整数；缺考为 0） */
export function formatItemScore(score: number): string {
  if (score === 0) {
    return '0'
  }
  return String(score)
}
