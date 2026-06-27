/** Validation result — PRD §5.7. */

export enum ValidationLevel {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Success = 'success'
}

export interface ValidationIssue {
  readonly rowIndex: number
  readonly columnName: string
  readonly level: ValidationLevel
  readonly errorCode: string
  readonly message: string
  readonly suggestion: string
}

export interface ValidationSummary {
  readonly totalCount: number
  readonly errorCount: number
  readonly warningCount: number
  readonly passedCount: number
}

export interface ValidationReport {
  readonly issues: readonly ValidationIssue[]
  readonly summary: ValidationSummary
  readonly passed: boolean
}
