import type { StudentFieldKey } from '@shared/models'

/**
 * Excel 表头 ↔ 系统字段映射 — PRD §5.21.
 * 表头变更时仅修改此配置，不修改业务代码。
 */
export const STUDENT_FIELD_MAPPINGS: readonly StudentFieldKey[] = [
  { key: 'className', excelHeader: '班级' },
  { key: 'examNumber', excelHeader: '考号' },
  { key: 'studentNumber', excelHeader: '学号' },
  { key: 'name', excelHeader: '姓名' },
  { key: 'gender', excelHeader: '性别' },
  { key: 'sitReach', excelHeader: '坐位体前屈成绩（单位：厘米）' },
  { key: 'sitReachWeight', excelHeader: '坐位体前屈得分占比' },
  { key: 'run800', excelHeader: '800m成绩（单位：分·秒）' },
  { key: 'run800Weight', excelHeader: '800m得分占比' },
  { key: 'run50', excelHeader: '50m成绩（单位：秒）' },
  { key: 'run50Weight', excelHeader: '50m得分占比' },
  { key: 'standingJump', excelHeader: '立定跳远成绩（单位：米）' },
  { key: 'standingJumpWeight', excelHeader: '立定跳远得分占比' },
  { key: 'sitUp', excelHeader: '仰卧起坐成绩（单位：次）' },
  { key: 'sitUpWeight', excelHeader: '仰卧起坐得分占比' }
] as const

/** 计算前输入 Excel 必须包含的表头（不含得分列） */
export const REQUIRED_INPUT_HEADERS: readonly string[] = STUDENT_FIELD_MAPPINGS.map(
  (field) => field.excelHeader
)

/** 导出 Excel 额外字段 — PRD §5.4 */
export const OUTPUT_SCORE_HEADERS = [
  '坐位体前屈得分',
  '800m得分',
  '50m得分',
  '立定跳远得分',
  '仰卧起坐得分',
  '总成绩'
] as const

export function getFieldKeyByHeader(header: string): StudentFieldKey['key'] | undefined {
  const normalized = header.trim()
  return STUDENT_FIELD_MAPPINGS.find((field) => field.excelHeader === normalized)?.key
}
