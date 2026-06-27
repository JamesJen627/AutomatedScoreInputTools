import { describe, expect, it } from 'vitest'
import { Gender } from '@shared/models'
import type { ScoreItemRule, ScoreRuleObject, Student } from '@shared/models'
import { ScoringEngine } from '@domain/scoring/scoring-engine'
import { auditCalculationReports } from '@domain/audit/audit-engine'

function buildRule(): ScoreRuleObject {
  const femaleJump: ScoreItemRule = {
    itemCode: 'standingJump',
    gender: Gender.Female,
    entries: [
      { performance: 2.3, score: 100 },
      { performance: 2.2, score: 95 },
      { performance: 2.1, score: 90 }
    ]
  }

  const items: ScoreItemRule[] = [
    femaleJump,
    {
      itemCode: 'run50',
      gender: Gender.Female,
      entries: [
        { performance: 7.5, score: 100 },
        { performance: 7.6, score: 95 },
        { performance: 7.7, score: 90 }
      ]
    },
    {
      itemCode: 'run800',
      gender: Gender.Female,
      entries: [
        { performance: 190, score: 100 },
        { performance: 200, score: 95 },
        { performance: 210, score: 90 }
      ]
    },
    {
      itemCode: 'sitReach',
      gender: Gender.Female,
      entries: [
        { performance: 20, score: 100 },
        { performance: 18, score: 95 },
        { performance: 16, score: 90 }
      ]
    },
    {
      itemCode: 'sitUp',
      gender: Gender.Female,
      entries: [
        { performance: 50, score: 100 },
        { performance: 45, score: 95 },
        { performance: 40, score: 90 }
      ]
    }
  ]

  return {
    manifest: {
      id: 'test.rule',
      name: '测试标准',
      version: '1.0.0',
      author: 'test',
      supportGender: [Gender.Female],
      supportedItems: ['sitReach', 'run800', 'run50', 'standingJump', 'sitUp']
    },
    pluginPath: '/test',
    items
  }
}

function buildStudent(overrides: Partial<Student> = {}): Student {
  return {
    rowIndex: 2,
    className: '高一(1)班',
    examNumber: 'E001',
    studentNumber: 'S001',
    name: '张三',
    gender: Gender.Female,
    sitReach: 19,
    sitReachWeight: 20,
    run800: 198,
    run800Weight: 20,
    run50: 7.56,
    run50Weight: 20,
    standingJump: 2.26,
    standingJumpWeight: 20,
    sitUp: 48,
    sitUpWeight: 20,
    ...overrides
  }
}

describe('ScoringEngine', () => {
  const engine = new ScoringEngine()
  const rule = buildRule()

  it('计算立定跳远 2.26m 得 95 分（Floor Rule）', () => {
    const result = engine.calculateStudent(buildStudent(), rule)
    expect(result.success).toBe(true)
    expect(result.standingJumpScore).toBe(95)
  })

  it('总成绩为五项加权之和，保留两位小数', () => {
    const result = engine.calculateStudent(buildStudent(), rule)
    expect(result.success).toBe(true)
    const expectedContribution = result.traces.reduce((sum, t) => sum + t.contributionScore, 0)
    expect(result.totalScore).toBe(Math.round(expectedContribution * 100) / 100)
  })

  it('计算轨迹包含完整步骤', () => {
    const result = engine.calculateStudent(buildStudent(), rule)
    const jumpTrace = result.traces.find((t) => t.itemCode === 'standingJump')
    expect(jumpTrace?.itemScore).toBe(95)
    expect(jumpTrace?.matchedPerformance).toBe(2.2)
    expect(jumpTrace?.contributionScore).toBe(19)
  })

  it('缺少性别规则时返回失败', () => {
    const maleStudent = buildStudent({ gender: Gender.Male })
    const result = engine.calculateStudent(maleStudent, rule)
    expect(result.success).toBe(false)
    expect(result.errorMessage).toContain('缺少评分标准')
  })

  it('批量计算与二次审核一致', () => {
    const students = [buildStudent()]
    const first = engine.calculateBatch(students, rule)
    const second = engine.calculateBatch(students, rule)
    expect(auditCalculationReports(first, second).auditPassed).toBe(true)
  })
})
