/** Unified error codes — PRD §5.21. */

export const ErrorCode = {
  MISSING_REQUIRED_HEADER: 'E001',
  INVALID_HEADER_NAME: 'E002',
  EMPTY_CELL: 'E003',
  INVALID_SCORE_FORMAT: 'E004',
  INVALID_GENDER: 'E005',
  DUPLICATE_STUDENT_NUMBER: 'E006',
  DUPLICATE_EXAM_NUMBER: 'E007',
  INVALID_WEIGHT: 'E008',
  SCORE_RULE_MISSING: 'E009',
  EXCEL_FILE_CORRUPT: 'E010'
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

export const ERROR_CODE_MESSAGES: Record<ErrorCodeValue, string> = {
  [ErrorCode.MISSING_REQUIRED_HEADER]: '缺少必填表头',
  [ErrorCode.INVALID_HEADER_NAME]: '表头名称错误',
  [ErrorCode.EMPTY_CELL]: '单元格为空',
  [ErrorCode.INVALID_SCORE_FORMAT]: '成绩格式错误',
  [ErrorCode.INVALID_GENDER]: '性别非法',
  [ErrorCode.DUPLICATE_STUDENT_NUMBER]: '学号重复',
  [ErrorCode.DUPLICATE_EXAM_NUMBER]: '考号重复',
  [ErrorCode.INVALID_WEIGHT]: '占比非法',
  [ErrorCode.SCORE_RULE_MISSING]: '评分标准缺失',
  [ErrorCode.EXCEL_FILE_CORRUPT]: 'Excel 文件损坏'
}
