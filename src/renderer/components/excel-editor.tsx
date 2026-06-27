import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClassParams,
  type CellValueChangedEvent,
  type ColDef,
  type GridApi,
  type GridReadyEvent
} from 'ag-grid-community'
import { REQUIRED_INPUT_HEADERS } from '@shared/constants/field-mapping'
import type { ValidationIssue } from '@shared/models'
import { ValidationLevel } from '@shared/models'
import type { CellFocusTarget } from '@shared/types'
import {
  excelRowToGridRowIndex,
  formatCellAddress,
  getColumnIndex,
  gridRowsToRecords,
  recordsToGridRows,
  type GridRowRecord
} from '@shared/utils'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

ModuleRegistry.registerModules([AllCommunityModule])

interface ExcelEditorProps {
  readonly gridRows: readonly (readonly string[])[]
  readonly validationIssues: readonly ValidationIssue[]
  readonly focusTarget: CellFocusTarget | null
  readonly onGridChange: (rows: readonly (readonly string[])[], options?: { recordHistory?: boolean }) => void
  readonly onSelectionChange: (rowIndex: number, columnName: string) => void
  readonly onFocusHandled: () => void
}

function buildIssueKey(rowIndex: number, columnName: string): string {
  return `${rowIndex}::${columnName}`
}

export function ExcelEditor({
  gridRows,
  validationIssues,
  focusTarget,
  onGridChange,
  onSelectionChange,
  onFocusHandled
}: ExcelEditorProps): React.ReactElement {
  const gridApiRef = useRef<GridApi<GridRowRecord> | null>(null)

  const issueMap = useMemo(() => {
    const map = new Map<string, ValidationIssue>()
    for (const issue of validationIssues) {
      if (issue.level === ValidationLevel.Error || issue.level === ValidationLevel.Warning) {
        map.set(buildIssueKey(issue.rowIndex, issue.columnName), issue)
      }
    }
    return map
  }, [validationIssues])

  const rowData = useMemo(() => gridRowsToRecords(gridRows), [gridRows])

  const columnDefs = useMemo<ColDef<GridRowRecord>[]>(
    () =>
      REQUIRED_INPUT_HEADERS.map((header) => ({
        field: header,
        headerName: header,
        editable: true,
        minWidth: 120,
        flex: 1,
        pinned: header === '班级' || header === '考号' ? 'left' : undefined,
        cellClassRules: {
          'cell-error': (params: CellClassParams<GridRowRecord>) => {
            const rowIndex = params.data?._excelRowIndex
            if (!rowIndex || !params.colDef.field) {
              return false
            }
            const issue = issueMap.get(buildIssueKey(rowIndex, params.colDef.field))
            return issue?.level === ValidationLevel.Error
          },
          'cell-warning': (params: CellClassParams<GridRowRecord>) => {
            const rowIndex = params.data?._excelRowIndex
            if (!rowIndex || !params.colDef.field) {
              return false
            }
            const issue = issueMap.get(buildIssueKey(rowIndex, params.colDef.field))
            return issue?.level === ValidationLevel.Warning
          }
        }
      })),
    [issueMap]
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true
    }),
    []
  )

  const handleGridReady = useCallback((event: GridReadyEvent<GridRowRecord>): void => {
    gridApiRef.current = event.api
  }, [])

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<GridRowRecord>): void => {
      const api = gridApiRef.current
      if (!api) {
        return
      }

      const records: GridRowRecord[] = []
      api.forEachNode((node) => {
        if (node.data) {
          records.push(node.data)
        }
      })

      onGridChange(recordsToGridRows(records), { recordHistory: true })

      const rowIndex = event.data?._excelRowIndex
      const columnName = event.colDef.field
      if (rowIndex && columnName) {
        onSelectionChange(rowIndex, columnName)
      }
    },
    [onGridChange, onSelectionChange]
  )

  const handleCellFocused = useCallback((): void => {
    const api = gridApiRef.current
    const focused = api?.getFocusedCell()
    if (!focused || focused.rowIndex === null || !focused.column) {
      return
    }
    const rowNode = api?.getDisplayedRowAtIndex(focused.rowIndex)
    const rowIndex = rowNode?.data?._excelRowIndex
    const columnName = focused.column.getColId()
    if (rowIndex && columnName) {
      onSelectionChange(rowIndex, columnName)
    }
  }, [onSelectionChange])

  useEffect(() => {
    if (!focusTarget || !gridApiRef.current) {
      return
    }

    const gridRowIndex = excelRowToGridRowIndex(focusTarget.rowIndex)
    const colIndex = getColumnIndex(focusTarget.columnName)

    if (gridRowIndex < 0 || colIndex < 0) {
      onFocusHandled()
      return
    }

    const column = gridApiRef.current.getAllGridColumns()[colIndex]
    if (!column) {
      onFocusHandled()
      return
    }

    gridApiRef.current.ensureIndexVisible(gridRowIndex, 'middle')
    gridApiRef.current.setFocusedCell(gridRowIndex, column.getColId())
    onFocusHandled()
  }, [focusTarget, onFocusHandled])

  return (
    <div className="excel-editor ag-theme-quartz">
      <AgGridReact<GridRowRecord>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={handleGridReady}
        onCellValueChanged={handleCellValueChanged}
        onCellFocused={handleCellFocused}
        singleClickEdit={false}
        undoRedoCellEditing={false}
        stopEditingWhenCellsLoseFocus
        headerHeight={36}
        rowHeight={32}
        getRowId={(params) => String(params.data._excelRowIndex)}
      />
    </div>
  )
}

export { formatCellAddress }
