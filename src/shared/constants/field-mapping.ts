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

/** 单项得分列（导入时可忽略，导出时插入各项目之间） */
export const OUTPUT_SCORE_HEADERS = [
  '坐位体前屈得分',
  '800m得分',
  '50m得分',
  '立定跳远得分',
  '仰卧起坐得分',
  '总成绩'
] as const

type ItemScoreField =
  | 'sitReachScore'
  | 'run800Score'
  | 'run50Score'
  | 'standingJumpScore'
  | 'sitUpScore'

type TotalScoreField = 'totalScore'

export interface ExportInputColumnBinding {
  readonly kind: 'input'
  readonly header: string
  readonly inputHeader: string
}

export interface ExportScoreColumnBinding {
  readonly kind: 'score'
  readonly header: string
  readonly scoreField: ItemScoreField | TotalScoreField
}

export interface ExportGradeColumnBinding {
  readonly kind: 'grade'
  readonly header: string
}

export type ExportColumnBinding =
  | ExportInputColumnBinding
  | ExportScoreColumnBinding
  | ExportGradeColumnBinding

/** 导出总表末尾等级列（系统计算，不可编辑） */
export const EXPORT_TOTAL_SCORE_GRADE_HEADER = '等级（优≥90%/良≥80%/合≥60%）' as const

/**
 * 00_DEMAND §2 导出表头 — 成绩 / 得分 / 占比交错排列，末尾为总成绩。
 * 「仰卧起坐成绩」导出列名不含单位后缀，数值仍来自输入列「仰卧起坐成绩（单位：次）」。
 */
export const EXPORT_COLUMN_BINDINGS: readonly ExportColumnBinding[] = [
  { kind: 'input', header: '班级', inputHeader: '班级' },
  { kind: 'input', header: '考号', inputHeader: '考号' },
  { kind: 'input', header: '学号', inputHeader: '学号' },
  { kind: 'input', header: '姓名', inputHeader: '姓名' },
  { kind: 'input', header: '性别', inputHeader: '性别' },
  {
    kind: 'input',
    header: '坐位体前屈成绩（单位：厘米）',
    inputHeader: '坐位体前屈成绩（单位：厘米）'
  },
  { kind: 'score', header: '坐位体前屈得分', scoreField: 'sitReachScore' },
  { kind: 'input', header: '坐位体前屈得分占比', inputHeader: '坐位体前屈得分占比' },
  { kind: 'input', header: '800m成绩（单位：分·秒）', inputHeader: '800m成绩（单位：分·秒）' },
  { kind: 'score', header: '800m得分', scoreField: 'run800Score' },
  { kind: 'input', header: '800m得分占比', inputHeader: '800m得分占比' },
  { kind: 'input', header: '50m成绩（单位：秒）', inputHeader: '50m成绩（单位：秒）' },
  { kind: 'score', header: '50m得分', scoreField: 'run50Score' },
  { kind: 'input', header: '50m得分占比', inputHeader: '50m得分占比' },
  { kind: 'input', header: '立定跳远成绩（单位：米）', inputHeader: '立定跳远成绩（单位：米）' },
  { kind: 'score', header: '立定跳远得分', scoreField: 'standingJumpScore' },
  { kind: 'input', header: '立定跳远得分占比', inputHeader: '立定跳远得分占比' },
  { kind: 'input', header: '仰卧起坐成绩', inputHeader: '仰卧起坐成绩（单位：次）' },
  { kind: 'score', header: '仰卧起坐得分', scoreField: 'sitUpScore' },
  { kind: 'input', header: '仰卧起坐得分占比', inputHeader: '仰卧起坐得分占比' },
  { kind: 'score', header: '总成绩', scoreField: 'totalScore' },
  { kind: 'grade', header: EXPORT_TOTAL_SCORE_GRADE_HEADER }
]

/** 00_DEMAND §2 完整导出表头（22 列，含等级） */
export const EXPORT_OUTPUT_HEADERS: readonly string[] = EXPORT_COLUMN_BINDINGS.map(
  (binding) => binding.header
)

/**
 * 常见简写表头 → 规范表头（如 docs/测试.xlsx 使用的缩写格式）。
 * 仅用于导入映射，不改变 REQUIRED_INPUT_HEADERS 规范名称。
 */
export const HEADER_ALIASES: Readonly<Record<string, string>> = {
  坐位体前屈成绩: '坐位体前屈成绩（单位：厘米）',
  坐位体前屈占比: '坐位体前屈得分占比',
  '800m成绩': '800m成绩（单位：分·秒）',
  '800m占比': '800m得分占比',
  '50m成绩': '50m成绩（单位：秒）',
  '50m占比': '50m得分占比',
  立定跳远成绩: '立定跳远成绩（单位：米）',
  立定跳远占比: '立定跳远得分占比',
  仰卧起坐成绩: '仰卧起坐成绩（单位：次）',
  仰卧起坐占比: '仰卧起坐得分占比',
  总得分: '总成绩'
}

/** 输入 Excel 中允许存在、但不参与校验的列（计算前可为空） */
export const IGNORED_INPUT_HEADERS: readonly string[] = [
  ...OUTPUT_SCORE_HEADERS,
  '总得分',
  EXPORT_TOTAL_SCORE_GRADE_HEADER
]

export function resolveCanonicalHeader(header: string): string {
  const normalized = header.trim()
  if (normalized.length === 0) {
    return normalized
  }
  const alias = HEADER_ALIASES[normalized]
  if (alias) {
    return alias
  }
  return normalized
}

export function isIgnoredInputHeader(header: string): boolean {
  const normalized = header.trim()
  const canonical = resolveCanonicalHeader(normalized)
  return IGNORED_INPUT_HEADERS.includes(normalized) || IGNORED_INPUT_HEADERS.includes(canonical)
}

export function isKnownInputHeader(header: string): boolean {
  const normalized = header.trim()
  if (normalized.length === 0) {
    return true
  }
  if (isIgnoredInputHeader(normalized)) {
    return true
  }
  const canonical = resolveCanonicalHeader(normalized)
  return STUDENT_FIELD_MAPPINGS.some((field) => field.excelHeader === canonical)
}

export function getFieldKeyByHeader(header: string): StudentFieldKey['key'] | undefined {
  const normalized = resolveCanonicalHeader(header)
  return STUDENT_FIELD_MAPPINGS.find((field) => field.excelHeader === normalized)?.key
}
