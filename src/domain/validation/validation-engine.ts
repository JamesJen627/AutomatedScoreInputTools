import { ErrorCode } from '@shared/constants'
import { STUDENT_FIELD_MAPPINGS } from '@shared/constants/field-mapping'
import { Gender, isGender, ValidationLevel, type Student, type ValidationIssue } from '@shared/models'
import { parseTimeToSeconds } from '@shared/utils'

const ILLEGAL_CHAR_PATTERN = /[@￥]/

const REQUIRED_STRING_FIELDS: Array<{ key: keyof Student; label: string }> = [
  { key: 'className', label: '班级' },
  { key: 'examNumber', label: '考号' },
  { key: 'studentNumber', label: '学号' },
  { key: 'name', label: '姓名' }
]

function getHeaderLabel(key: keyof Student): string {
  return STUDENT_FIELD_MAPPINGS.find((field) => field.key === key)?.excelHeader ?? String(key)
}

function pushEmptyCellIssues(student: Student, issues: ValidationIssue[]): void {
  for (const field of REQUIRED_STRING_FIELDS) {
    const value = student[field.key]
    if (typeof value === 'string' && value.trim().length === 0) {
      issues.push({
        rowIndex: student.rowIndex,
        columnName: field.label,
        level: ValidationLevel.Error,
        errorCode: ErrorCode.EMPTY_CELL,
        message: `${field.label}不能为空`,
        suggestion: '请填写完整信息'
      })
    }
  }
}

function validateGender(student: Student, issues: ValidationIssue[]): void {
  const raw = String(student.gender)
  if (!isGender(raw)) {
    issues.push({
      rowIndex: student.rowIndex,
      columnName: '性别',
      level: ValidationLevel.Error,
      errorCode: ErrorCode.INVALID_GENDER,
      message: `性别非法：${raw}`,
      suggestion: '性别仅允许填写「男」或「女」'
    })
  }
}

function validateWeights(student: Student, issues: ValidationIssue[]): void {
  const weightFields: Array<keyof Student> = [
    'sitReachWeight',
    'run800Weight',
    'run50Weight',
    'standingJumpWeight',
    'sitUpWeight'
  ]

  for (const key of weightFields) {
    const value = student[key] as number
    const label = getHeaderLabel(key)
    if (Number.isNaN(value) || value < 0 || value > 100) {
      issues.push({
        rowIndex: student.rowIndex,
        columnName: label,
        level: ValidationLevel.Error,
        errorCode: ErrorCode.INVALID_WEIGHT,
        message: `${label}必须在 0 到 100 之间`,
        suggestion: '请检查占比数值'
      })
    }
  }

  const totalWeight =
    student.sitReachWeight +
    student.run800Weight +
    student.run50Weight +
    student.standingJumpWeight +
    student.sitUpWeight

  if (Math.abs(totalWeight - 100) > 0.001) {
    issues.push({
      rowIndex: student.rowIndex,
      columnName: '占比总和',
      level: ValidationLevel.Warning,
      errorCode: ErrorCode.INVALID_WEIGHT,
      message: `占比总和为 ${totalWeight}%，不是 100%`,
      suggestion: '建议调整各项目占比使总和为 100%'
    })
  }
}

function validateDuplicates(students: readonly Student[], issues: ValidationIssue[]): void {
  const studentNumbers = new Map<string, number>()
  const examNumbers = new Map<string, number>()

  for (const student of students) {
    const sn = student.studentNumber.trim()
    if (sn.length > 0) {
      const firstRow = studentNumbers.get(sn)
      if (firstRow !== undefined) {
        issues.push({
          rowIndex: student.rowIndex,
          columnName: '学号',
          level: ValidationLevel.Error,
          errorCode: ErrorCode.DUPLICATE_STUDENT_NUMBER,
          message: `学号重复：${sn}（首次出现于第 ${firstRow} 行）`,
          suggestion: '请修正重复学号'
        })
      } else {
        studentNumbers.set(sn, student.rowIndex)
      }
    }

    const en = student.examNumber.trim()
    if (en.length > 0) {
      const firstRow = examNumbers.get(en)
      if (firstRow !== undefined) {
        issues.push({
          rowIndex: student.rowIndex,
          columnName: '考号',
          level: ValidationLevel.Error,
          errorCode: ErrorCode.DUPLICATE_EXAM_NUMBER,
          message: `考号重复：${en}（首次出现于第 ${firstRow} 行）`,
          suggestion: '请修正重复考号'
        })
      } else {
        examNumbers.set(en, student.rowIndex)
      }
    }
  }
}

export class ValidationEngine {
  validate(students: readonly Student[]): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    for (const student of students) {
      pushEmptyCellIssues(student, issues)
      validateGender(student, issues)
      validateWeights(student, issues)
    }

    validateDuplicates(students, issues)
    return issues
  }
}

export interface RawRowValues {
  readonly rowIndex: number
  readonly values: Record<string, string>
}

export function parseStudentFromRawRow(row: RawRowValues): { student?: Student; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  const get = (header: string): string => row.values[header]?.trim() ?? ''

  const className = get('班级')
  const examNumber = get('考号')
  const studentNumber = get('学号')
  const name = get('姓名')
  const genderRaw = get('性别')

  const sitReachRaw = get('坐位体前屈成绩（单位：厘米）')
  const run800Raw = get('800m成绩（单位：分·秒）')
  const run50Raw = get('50m成绩（单位：秒）')
  const standingJumpRaw = get('立定跳远成绩（单位：米）')
  const sitUpRaw = get('仰卧起坐成绩（单位：次）')

  const weightHeaders = [
    '坐位体前屈得分占比',
    '800m得分占比',
    '50m得分占比',
    '立定跳远得分占比',
    '仰卧起坐得分占比'
  ] as const

  for (const header of [
    ...REQUIRED_STRING_FIELDS.map((f) => getHeaderLabel(f.key)),
    '性别',
    '坐位体前屈成绩（单位：厘米）',
    '800m成绩（单位：分·秒）',
    '50m成绩（单位：秒）',
    '立定跳远成绩（单位：米）',
    '仰卧起坐成绩（单位：次）',
    ...weightHeaders
  ]) {
    const cell = get(header)
    if (cell.length === 0) {
      issues.push({
        rowIndex: row.rowIndex,
        columnName: header,
        level: ValidationLevel.Error,
        errorCode: ErrorCode.EMPTY_CELL,
        message: `${header}不能为空`,
        suggestion: '请填写完整成绩与占比'
      })
    } else if (ILLEGAL_CHAR_PATTERN.test(cell)) {
      issues.push({
        rowIndex: row.rowIndex,
        columnName: header,
        level: ValidationLevel.Error,
        errorCode: ErrorCode.INVALID_SCORE_FORMAT,
        message: `${header}包含非法字符`,
        suggestion: '请移除特殊字符后重新填写'
      })
    }
  }

  let sitReach = Number.NaN
  if (sitReachRaw.length > 0 && !Number.isNaN(Number(sitReachRaw))) {
    sitReach = Number(sitReachRaw)
  } else if (sitReachRaw.length > 0) {
    issues.push({
      rowIndex: row.rowIndex,
      columnName: '坐位体前屈成绩（单位：厘米）',
      level: ValidationLevel.Error,
      errorCode: ErrorCode.INVALID_SCORE_FORMAT,
      message: '坐位体前屈成绩格式错误',
      suggestion: '请填写数字，可为负数，如 12.5 或 -2.1'
    })
  }

  let run50 = Number.NaN
  if (run50Raw.length > 0 && /^\d+(\.\d+)?$/.test(run50Raw)) {
    run50 = Number(run50Raw)
  } else if (run50Raw.length > 0) {
    issues.push({
      rowIndex: row.rowIndex,
      columnName: '50m成绩（单位：秒）',
      level: ValidationLevel.Error,
      errorCode: ErrorCode.INVALID_SCORE_FORMAT,
      message: '50米成绩格式错误',
      suggestion: '请仅填写数字，如 7.56'
    })
  }

  let run800 = Number.NaN
  const run800Seconds = parseTimeToSeconds(run800Raw)
  if (run800Raw.length > 0 && run800Seconds !== null) {
    run800 = run800Seconds
  } else if (run800Raw.length > 0) {
    issues.push({
      rowIndex: row.rowIndex,
      columnName: '800m成绩（单位：分·秒）',
      level: ValidationLevel.Error,
      errorCode: ErrorCode.INVALID_SCORE_FORMAT,
      message: '800米成绩格式错误',
      suggestion: "请使用 mm'ss'' 格式，如 3'25''"
    })
  }

  let standingJump = Number.NaN
  if (standingJumpRaw.length > 0 && /^\d+(\.\d+)?$/.test(standingJumpRaw)) {
    standingJump = Number(standingJumpRaw)
  } else if (standingJumpRaw.length > 0) {
    issues.push({
      rowIndex: row.rowIndex,
      columnName: '立定跳远成绩（单位：米）',
      level: ValidationLevel.Error,
      errorCode: ErrorCode.INVALID_SCORE_FORMAT,
      message: '立定跳远成绩格式错误',
      suggestion: '请填写米为单位的小数，如 2.31'
    })
  }

  let sitUp = Number.NaN
  if (sitUpRaw.length > 0 && /^\d+$/.test(sitUpRaw)) {
    sitUp = Number.parseInt(sitUpRaw, 10)
  } else if (sitUpRaw.length > 0) {
    issues.push({
      rowIndex: row.rowIndex,
      columnName: '仰卧起坐成绩（单位：次）',
      level: ValidationLevel.Error,
      errorCode: ErrorCode.INVALID_SCORE_FORMAT,
      message: '仰卧起坐成绩格式错误',
      suggestion: '请填写整数，如 46'
    })
  }

  const parseWeight = (header: string): number => {
    const raw = get(header)
    const num = Number(raw)
    return Number.isNaN(num) ? Number.NaN : num
  }

  const sitReachWeight = parseWeight('坐位体前屈得分占比')
  const run800Weight = parseWeight('800m得分占比')
  const run50Weight = parseWeight('50m得分占比')
  const standingJumpWeight = parseWeight('立定跳远得分占比')
  const sitUpWeight = parseWeight('仰卧起坐得分占比')

  const gender = isGender(genderRaw) ? genderRaw : Gender.Male

  const hasBlockingError = issues.some((issue) => issue.level === ValidationLevel.Error)
  if (hasBlockingError) {
    return { issues }
  }

  return {
    student: {
      rowIndex: row.rowIndex,
      className,
      examNumber,
      studentNumber,
      name,
      gender,
      sitReach,
      sitReachWeight,
      run800,
      run800Weight,
      run50,
      run50Weight,
      standingJump,
      standingJumpWeight,
      sitUp,
      sitUpWeight
    },
    issues
  }
}

export function buildValidationReport(issues: readonly ValidationIssue[], totalCount: number) {
  const errorCount = issues.filter((i) => i.level === ValidationLevel.Error).length
  const warningCount = issues.filter((i) => i.level === ValidationLevel.Warning).length
  const passedCount = errorCount === 0 ? totalCount : Math.max(0, totalCount - errorCount)

  return {
    issues,
    summary: {
      totalCount,
      errorCount,
      warningCount,
      passedCount
    },
    passed: errorCount === 0
  }
}
