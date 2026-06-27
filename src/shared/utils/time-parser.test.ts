import { describe, expect, it } from 'vitest'
import { parseRun50Seconds } from '@shared/utils/time-parser'

describe('parseRun50Seconds', () => {
  it('解析小数秒', () => {
    expect(parseRun50Seconds('7.56')).toBe(7.56)
  })

  it('解析计时器格式 8"7', () => {
    expect(parseRun50Seconds('8"7')).toBeCloseTo(8.7)
  })

  it('解析计时器格式 7"56', () => {
    expect(parseRun50Seconds('7"56')).toBeCloseTo(7.56)
  })

  it('空字符串返回 null', () => {
    expect(parseRun50Seconds('')).toBeNull()
  })
})
