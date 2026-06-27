import { ErrorCode } from '@shared/constants'
import { REQUIRED_INPUT_HEADERS } from '@shared/constants/field-mapping'
import {
  buildValidationReport,
  parseStudentFromRawRow,
  validateHeaders,
  ValidationEngine,
  type RawRowValues
} from '@domain/validation'
import { ValidationLevel, type Student, type ValidationIssue, type ValidationReport } from '@shared/models'

export interface DatasetValidationResult {
  readonly students: readonly Student[]
  readonly issues: readonly ValidationIssue[]
  readonly report: ValidationReport
  readonly passed: boolean
}

function mapRowToValues(headers: readonly string[], row: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {}
  headers.forEach((header, index) => {
    if (header.length > 0) {
      values[header] = (row[index] ?? '').trim()
    }
  })
  return values
}

function parseDataRows(dataRows: readonly (readonly string[])[]): {
  students: Student[]
  issues: ValidationIssue[]
} {
  const students: Student[] = []
  const issues: ValidationIssue[] = []

  dataRows.forEach((row, index) => {
    const rowIndex = index + 2
    const rawRow: RawRowValues = {
      rowIndex,
      values: mapRowToValues(REQUIRED_INPUT_HEADERS, row)
    }
    const parsed = parseStudentFromRawRow(rawRow)
    issues.push(...parsed.issues)
    if (parsed.student) {
      students.push(parsed.student)
    }
  })

  return { students, issues }
}

/**
 * 从网格数据（含表头行）执行完整校验 — 供 Excel 解析与在线编辑共用。
 */
export function validateGridRows(allRows: readonly (readonly string[])[]): DatasetValidationResult {
  if (allRows.length === 0) {
    const issues: ValidationIssue[] = [
      {
        rowIndex: 0,
        columnName: '-',
        level: ValidationLevel.Error,
        errorCode: ErrorCode.EXCEL_FILE_CORRUPT,
        message: '当前工作表没有数据',
        suggestion: '请填写成绩数据后重试'
      }
    ]
    const report = buildValidationReport(issues, 0)
    return { students: [], issues, report, passed: false }
  }

  const headers = allRows[0].map((header) => header.trim())
  const headerIssues = validateHeaders(headers)
  if (headerIssues.some((issue) => issue.level === ValidationLevel.Error)) {
    const report = buildValidationReport(headerIssues, 0)
    return { students: [], issues: headerIssues, report, passed: false }
  }

  const dataRows = allRows.slice(1).filter((row) => row.some((cell) => cell.trim().length > 0))
  if (dataRows.length === 0) {
    const issues: ValidationIssue[] = [
      ...headerIssues,
      {
        rowIndex: 2,
        columnName: '-',
        level: ValidationLevel.Error,
        errorCode: ErrorCode.EMPTY_CELL,
        message: '未找到学生数据行',
        suggestion: '请在表头下方填写学生成绩'
      }
    ]
    const report = buildValidationReport(issues, 0)
    return { students: [], issues, report, passed: false }
  }

  const { students, issues: rowIssues } = parseDataRows(dataRows)
  const engine = new ValidationEngine()
  const engineIssues = engine.validate(students)
  const issues = [...headerIssues, ...rowIssues, ...engineIssues]
  const report = buildValidationReport(issues, students.length)

  return {
    students,
    issues,
    report,
    passed: report.passed
  }
}

/**
 * 规范化网格：保证表头正确、每行列数与表头一致。
 */
export function normalizeGridRows(allRows: readonly (readonly string[])[]): string[][] {
  const headerRow = [...REQUIRED_INPUT_HEADERS]
  const dataRows = allRows.slice(1).map((row) => {
    const normalized = headerRow.map((_, index) => String(row[index] ?? '').trim())
    return normalized
  })
  return [headerRow, ...dataRows]
}
