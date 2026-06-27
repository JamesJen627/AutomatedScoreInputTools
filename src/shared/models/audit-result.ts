export interface AuditDifference {
  readonly rowIndex: number
  readonly studentNumber: string
  readonly name: string
  readonly field: string
  readonly fieldLabel: string
  readonly firstValue: number
  readonly secondValue: number
  readonly reason: string
}

export interface AuditReport {
  readonly auditPassed: boolean
  readonly checkedAt: string
  readonly totalStudents: number
  readonly differenceCount: number
  readonly differences: readonly AuditDifference[]
}

export interface ExportRecord {
  readonly filePath: string
  readonly fileName: string
  readonly exportedAt: string
  readonly rowCount: number
}
