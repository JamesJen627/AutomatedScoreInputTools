import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Gender } from '@shared/models'
import { ScoringEngine } from '@domain/scoring/scoring-engine'
import { loadScoreRulePlugin } from '@domain/rules/rule-parser'
import {
  assertOfficialTableCoverage,
  countRuleEntries,
  importOfficialScoringTable,
  parseOfficialScoringTable
} from '@infrastructure/excel/official-scoring-table-parser'
import { resolveGradeLevelFromClassName } from '@shared/constants/grade-level'

const SOURCE_TABLE = join(process.cwd(), 'docs', '成绩单项评分表.xlsx')
const TARGET_RULE = join(process.cwd(), 'ScoreRules', '2025', 'rule.xlsx')

describe('official-scoring-table-parser', () => {
  it('解析 docs/成绩单项评分表.xlsx 并覆盖全部年级性别项目', () => {
    const items = parseOfficialScoringTable(SOURCE_TABLE)
    assertOfficialTableCoverage(items)
    expect(countRuleEntries(items)).toBeGreaterThan(500)
  })

  it('从官方表生成 ScoreRules/2025/rule.xlsx', () => {
    const items = importOfficialScoringTable(SOURCE_TABLE, TARGET_RULE)
    expect(items.length).toBe(30)

    const loaded = loadScoreRulePlugin(join(process.cwd(), 'ScoreRules', '2025'))
    expect(loaded.issues).toEqual([])
    expect(loaded.rule?.items.length).toBe(30)

    const allScores = new Set<number>()
    for (const item of items) {
      for (const entry of item.entries) {
        allScores.add(entry.score)
      }
    }
    expect(allScores.has(78)).toBe(true)
    expect(allScores.has(76)).toBe(true)
    expect(allScores.has(62)).toBe(true)
  })

  it('701班初一女生按官方表查分', () => {
    importOfficialScoringTable(SOURCE_TABLE, TARGET_RULE)
    const loaded = loadScoreRulePlugin(join(process.cwd(), 'ScoreRules', '2025'))
    const engine = new ScoringEngine()
    const rule = loaded.rule
    expect(rule).toBeDefined()
    if (!rule) {
      return
    }

    expect(resolveGradeLevelFromClassName('701')).toBe('初一')

    const result = engine.calculateStudent(
      {
        rowIndex: 2,
        className: '701',
        examNumber: '20250101',
        studentNumber: '1',
        name: '测试',
        gender: Gender.Female,
        sitReach: 19,
        sitReachWeight: 10,
        run800: 210,
        run800Weight: 20,
        run50: 8.7,
        run50Weight: 20,
        standingJump: 1.71,
        standingJumpWeight: 10,
        sitUp: 58,
        sitUpWeight: 10
      },
      rule
    )

    expect(result.success).toBe(true)
    expect(result.sitReachScore).toBe(90)
    expect(result.run800Score).toBe(100)
    expect(result.run50Score).toBe(80)
    expect(result.standingJumpScore).toBe(80)
    expect(result.sitUpScore).toBe(100)
  })
})
