import { describe, expect, it } from 'vitest'
import { resolveGradeLevelFromClassName } from '@shared/constants/grade-level'

describe('resolveGradeLevelFromClassName', () => {
  it('从数字班级推断年级', () => {
    expect(resolveGradeLevelFromClassName('701')).toBe('初一')
    expect(resolveGradeLevelFromClassName('802')).toBe('初二')
    expect(resolveGradeLevelFromClassName('903')).toBe('初三')
  })
})
