import { describe, expect, it } from 'vitest'
import { rawExcelRowsToGrid } from '@shared/utils/grid-utils'

/** docs/测试.xlsx 的表头与首行数据（21 列，含中间得分列） */
const TEST_FILE_ROWS: string[][] = [
  [
    '班级',
    '考号',
    '学号',
    '姓名',
    '性别',
    '坐位体前屈成绩',
    '坐位体前屈得分',
    '坐位体前屈占比',
    '800m成绩',
    '800m得分',
    '800m占比',
    '50m成绩',
    '50m得分',
    '50m占比',
    '立定跳远成绩',
    '立定跳远得分',
    '立定跳远占比',
    '仰卧起坐成绩',
    '仰卧起坐得分',
    '仰卧起坐占比',
    '总得分'
  ],
  [
    '701',
    '20250101',
    '1',
    '曾晨貽',
    '女',
    '19',
    '',
    '10',
    "3'30\"",
    '',
    '20',
    '8"7',
    '',
    '20',
    '1.71',
    '',
    '10',
    '58',
    '',
    '10',
    ''
  ]
]

describe('rawExcelRowsToGrid', () => {
  it('按表头名称映射 docs/测试.xlsx 格式，不因中间得分列移位', () => {
    const grid = rawExcelRowsToGrid(TEST_FILE_ROWS)
    const dataRow = grid[1]

    expect(dataRow?.[5]).toBe('19')
    expect(dataRow?.[6]).toBe('10')
    expect(dataRow?.[7]).toBe("3'30\"")
    expect(dataRow?.[8]).toBe('20')
    expect(dataRow?.[9]).toBe('8"7')
    expect(dataRow?.[10]).toBe('20')
    expect(dataRow?.[11]).toBe('1.71')
    expect(dataRow?.[12]).toBe('10')
    expect(dataRow?.[13]).toBe('58')
    expect(dataRow?.[14]).toBe('10')
  })
})
