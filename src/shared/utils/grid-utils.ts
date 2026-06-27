import { REQUIRED_INPUT_HEADERS, STUDENT_FIELD_MAPPINGS } from '@shared/constants/field-mapping'
import type { Student } from '@shared/models'
import { formatSecondsToTime } from '@shared/utils'

/** Student → 网格行（字符串，与表头顺序一致） */
export function studentsToGridRows(students: readonly Student[]): string[][] {
  const headerRow = [...REQUIRED_INPUT_HEADERS]
  const dataRows = students.map((student) =>
    STUDENT_FIELD_MAPPINGS.map((field) => studentValueToCell(student, field.key))
  )
  return [headerRow, ...dataRows]
}

function studentValueToCell(student: Student, key: keyof Omit<Student, 'rowIndex'>): string {
  switch (key) {
    case 'run800':
      return formatSecondsToTime(student.run800)
    case 'sitReach':
    case 'run50':
    case 'standingJump':
    case 'sitReachWeight':
    case 'run800Weight':
    case 'run50Weight':
    case 'standingJumpWeight':
    case 'sitUpWeight':
      return String(student[key])
    case 'sitUp':
      return String(student.sitUp)
    default:
      return String(student[key])
  }
}

/** 从原始 Excel 行构建网格（保留未通过校验行的原始文本） */
export function rawExcelRowsToGrid(rows: readonly (readonly string[])[]): string[][] {
  const headerRow = [...REQUIRED_INPUT_HEADERS]
  const dataRows = rows.slice(1).map((row) =>
    headerRow.map((_, index) => String(row[index] ?? '').trim())
  )
  return [headerRow, ...dataRows]
}

export function getColumnIndex(columnName: string): number {
  return REQUIRED_INPUT_HEADERS.indexOf(columnName)
}

export function formatCellAddress(rowIndex: number, columnName: string): string {
  const colIndex = getColumnIndex(columnName)
  if (colIndex < 0) {
    return `R${rowIndex}`
  }
  const colLetter = columnIndexToLetter(colIndex)
  return `${colLetter}${rowIndex}`
}

function columnIndexToLetter(index: number): string {
  let result = ''
  let n = index
  do {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return result
}

/** Excel 行号（1-based，含表头）→ AG Grid 数据行索引（0-based，不含表头） */
export function excelRowToGridRowIndex(excelRowIndex: number): number {
  return excelRowIndex - 2
}

export interface GridRowRecord {
  _excelRowIndex: number
  [header: string]: string | number
}

export function gridRowsToRecords(gridRows: readonly (readonly string[])[]): GridRowRecord[] {
  const headers = gridRows[0] ?? []
  return gridRows.slice(1).map((row, index) => {
    const record: GridRowRecord = { _excelRowIndex: index + 2 }
    headers.forEach((header, colIndex) => {
      record[header] = row[colIndex] ?? ''
    })
    return record
  })
}

export function recordsToGridRows(records: readonly GridRowRecord[]): string[][] {
  const headerRow = [...REQUIRED_INPUT_HEADERS]
  const dataRows = records.map((record) =>
    headerRow.map((header) => String(record[header] ?? '').trim())
  )
  return [headerRow, ...dataRows]
}
