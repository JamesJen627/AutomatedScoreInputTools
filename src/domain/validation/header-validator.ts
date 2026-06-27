import { ErrorCode } from '@shared/constants'
import {
  isKnownInputHeader,
  REQUIRED_INPUT_HEADERS,
  resolveCanonicalHeader
} from '@shared/constants/field-mapping'
import { ValidationLevel, type ValidationIssue } from '@shared/models'

export function validateHeaders(headers: readonly string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const trimmedHeaders = headers.map((header) => header.trim())
  const canonicalHeaders = new Set(
    trimmedHeaders
      .filter((header) => header.length > 0)
      .map((header) => resolveCanonicalHeader(header))
  )

  for (const required of REQUIRED_INPUT_HEADERS) {
    if (!canonicalHeaders.has(required)) {
      issues.push({
        rowIndex: 1,
        columnName: required,
        level: ValidationLevel.Error,
        errorCode: ErrorCode.MISSING_REQUIRED_HEADER,
        message: `缺少必填表头：${required}`,
        suggestion: '请补充表头或恢复原始模板'
      })
    }
  }

  for (const header of trimmedHeaders) {
    if (header.length === 0) {
      continue
    }
    if (!isKnownInputHeader(header)) {
      issues.push({
        rowIndex: 1,
        columnName: header,
        level: ValidationLevel.Error,
        errorCode: ErrorCode.INVALID_HEADER_NAME,
        message: `未知表头：${header}`,
        suggestion: '请检查表头名称是否与模板完全一致'
      })
    }
  }

  return issues
}
