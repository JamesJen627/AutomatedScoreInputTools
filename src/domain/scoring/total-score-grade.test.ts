import { describe, expect, it } from 'vitest'
import { Gender } from '@shared/models'
import type { Student } from '@shared/models'
import {
  classifyTotalScoreGrade,
  computeMaxPossibleTotalScore
} from '@domain/scoring/total-score-grade'

function buildStudent(weights: Partial<Pick<Student, 'sitReachWeight' | 'run800Weight' | 'run50Weight' | 'standingJumpWeight' | 'sitUpWeight'>> = {}): Student {
  return {
    rowIndex: 2,
    className: '701',
    examNumber: 'E001',
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
    sitUpWeight: 10,
    ...weights
  }
}

describe('computeMaxPossibleTotalScore', () => {
  it('最高总成绩等于各项目占比之和（每项满分 100）', () => {
    expect(computeMaxPossibleTotalScore(buildStudent())).toBe(70)
    expect(computeMaxPossibleTotalScore(buildStudent({
      sitReachWeight: 20,
      run800Weight: 20,
      run50Weight: 20,
      standingJumpWeight: 20,
      sitUpWeight: 20
    }))).toBe(100)
  })
})

describe('classifyTotalScoreGrade', () => {
  it('以该生最高可获总成绩为满分判定', () => {
    const fullMark = 70
    expect(classifyTotalScoreGrade(63, fullMark)).toBe('优')
    expect(classifyTotalScoreGrade(62.99, fullMark)).toBe('良')
    expect(classifyTotalScoreGrade(56, fullMark)).toBe('良')
    expect(classifyTotalScoreGrade(55.99, fullMark)).toBe('合')
    expect(classifyTotalScoreGrade(42, fullMark)).toBe('合')
    expect(classifyTotalScoreGrade(41.99, fullMark)).toBe('不合格')
  })

  it('占比合计 100 时与固定满分 100 等价', () => {
    expect(classifyTotalScoreGrade(90, 100)).toBe('优')
    expect(classifyTotalScoreGrade(59.99, 100)).toBe('不合格')
  })
})
