import type { Student, ValidationIssue, ValidationReport } from '@shared/models'

export interface ExcelParseSuccess {
  readonly success: true
  readonly fileName: string
  readonly filePath: string
  readonly sheetName: string
  readonly students: readonly Student[]
  readonly issues: readonly ValidationIssue[]
  readonly report: ValidationReport
  readonly gridRows: readonly (readonly string[])[]
  readonly importedAt: string
}

export interface ExcelParseFailure {
  readonly success: false
  readonly fileName: string
  readonly filePath: string
  readonly issues: readonly ValidationIssue[]
}

export type ExcelParseResult = ExcelParseSuccess | ExcelParseFailure
