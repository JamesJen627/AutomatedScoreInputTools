import { describe, expect, it } from 'vitest'
import { parseStudentFromRawRow } from '@domain/validation/validation-engine'
import { ValidationLevel } from '@shared/models'

const BASE_ROW_VALUES = {
  班级: '701',
  考号: '20250101',
  学号: '1',
  姓名: '测试',
  性别: '女',
  '坐位体前屈成绩（单位：厘米）': '19',
  '坐位体前屈得分占比': '10',
  '800m成绩（单位：分·秒）': "3'30\"",
  '800m得分占比': '20',
  '50m成绩（单位：秒）': '8.7',
  '50m得分占比': '20',
  '立定跳远成绩（单位：米）': '1.71',
  '立定跳远得分占比': '10',
  '仰卧起坐成绩（单位：次）': '58',
  '仰卧起坐得分占比': '10'
} as const

describe('parseStudentFromRawRow', () => {
  it('允许单项成绩为空', () => {
    const result = parseStudentFromRawRow({
      rowIndex: 2,
      values: {
        ...BASE_ROW_VALUES,
        '坐位体前屈成绩（单位：厘米）': '',
        '仰卧起坐成绩（单位：次）': ''
      }
    })

    expect(result.student).toBeDefined()
    expect(result.issues.some((issue) => issue.level === ValidationLevel.Error)).toBe(false)
    expect(Number.isNaN(result.student?.sitReach ?? 0)).toBe(true)
    expect(Number.isNaN(result.student?.sitUp ?? 0)).toBe(true)
    expect(result.student?.run800).toBeGreaterThan(0)
  })

  it('解析 50m 计时格式 8"7', () => {
    const result = parseStudentFromRawRow({
      rowIndex: 2,
      values: {
        ...BASE_ROW_VALUES,
        '50m成绩（单位：秒）': '8"7'
      }
    })

    expect(result.student).toBeDefined()
    expect(result.issues.some((issue) => issue.level === ValidationLevel.Error)).toBe(false)
    expect(result.student?.run50).toBeCloseTo(8.7)
  })
})
