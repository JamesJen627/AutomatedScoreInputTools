import { describe, expect, it } from 'vitest'
import { LookupStrategy } from '@shared/constants/score-items'
import type { ScoreRuleEntry } from '@shared/models'
import { lookupScore, normalizeWeightFactor, roundTotalScore } from '@domain/scoring/lookup-strategy'

describe('lookupScore', () => {
  const higherBetterEntries: ScoreRuleEntry[] = [
    { performance: 2.3, score: 100 },
    { performance: 2.2, score: 95 },
    { performance: 2.1, score: 90 }
  ]

  it('HigherIsBetter: 取下限 — 2.26 匹配 2.20 得 95 分（PRD §3.6）', () => {
    const result = lookupScore(higherBetterEntries, 2.26, LookupStrategy.HigherIsBetter)
    expect(result.score).toBe(95)
    expect(result.matchedPerformance).toBe(2.2)
    expect(result.boundary).toBe('normal')
  })

  it('HigherIsBetter: 优于最高档取最高分', () => {
    const result = lookupScore(higherBetterEntries, 2.45, LookupStrategy.HigherIsBetter)
    expect(result.score).toBe(100)
    expect(result.boundary).toBe('above_best')
  })

  it('HigherIsBetter: 低于最低档取最低分', () => {
    const result = lookupScore(higherBetterEntries, 1.0, LookupStrategy.HigherIsBetter)
    expect(result.score).toBe(90)
    expect(result.boundary).toBe('below_worst')
  })

  const lowerBetterEntries: ScoreRuleEntry[] = [
    { performance: 7.5, score: 100 },
    { performance: 7.6, score: 95 },
    { performance: 7.7, score: 90 }
  ]

  it('LowerIsBetter: 7.56 匹配 7.60 得 95 分', () => {
    const result = lookupScore(lowerBetterEntries, 7.56, LookupStrategy.LowerIsBetter)
    expect(result.score).toBe(95)
    expect(result.matchedPerformance).toBe(7.6)
  })

  it('LowerIsBetter: 800m 3\'18" 匹配 3\'20" 得 95 分（PRD §3.6）', () => {
    const timeEntries: ScoreRuleEntry[] = [
      { performance: 190, score: 100 },
      { performance: 200, score: 95 },
      { performance: 210, score: 90 }
    ]
    const result = lookupScore(timeEntries, 198, LookupStrategy.LowerIsBetter)
    expect(result.score).toBe(95)
    expect(result.matchedPerformance).toBe(200)
  })

  it('空条目返回 0 分', () => {
    const result = lookupScore([], 10, LookupStrategy.HigherIsBetter)
    expect(result.score).toBe(0)
  })

  it('完整档位表可命中 78、76 等中间得分（非仅 90/85/80）', () => {
    const tiers: ScoreRuleEntry[] = [
      { performance: 20, score: 100 },
      { performance: 18, score: 95 },
      { performance: 16, score: 90 },
      { performance: 14, score: 85 },
      { performance: 12, score: 80 },
      { performance: 11, score: 78 },
      { performance: 10, score: 76 }
    ]

    expect(lookupScore(tiers, 11.5, LookupStrategy.HigherIsBetter).score).toBe(78)
    expect(lookupScore(tiers, 10.5, LookupStrategy.HigherIsBetter).score).toBe(76)
  })
})

describe('normalizeWeightFactor', () => {
  it('20 转换为 0.20', () => {
    expect(normalizeWeightFactor(20)).toBe(0.2)
  })

  it('0.2 保持不变', () => {
    expect(normalizeWeightFactor(0.2)).toBe(0.2)
  })
})

describe('roundTotalScore', () => {
  it('保留两位小数四舍五入', () => {
    expect(roundTotalScore(19.005)).toBe(19.01)
    expect(roundTotalScore(19.004)).toBe(19.0)
  })
})
