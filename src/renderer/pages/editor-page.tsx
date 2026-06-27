import { Link, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ExcelEditor } from '@renderer/components/excel-editor'
import { useAppContext } from '@renderer/context/app-context'
import { AppRoute } from '@shared/types/app-state'
import { ValidationLevel } from '@shared/models'
import { formatCellAddress } from '@shared/utils'

export function EditorPage(): React.ReactElement {
  const {
    gridRows,
    validationIssues,
    focusTarget,
    isDirty,
    importSession,
    statusBar,
    canUndo,
    canRedo,
    updateGridRows,
    markSaved,
    clearFocusTarget,
    setStatusBar,
    undo,
    redo
  } = useAppContext()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!event.ctrlKey) {
        return
      }
      if (event.key === 'z') {
        event.preventDefault()
        undo()
      }
      if (event.key === 'y') {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  if (!gridRows || !importSession) {
    return <Navigate to={AppRoute.IMPORT} replace />
  }

  const errorCount = validationIssues.filter((i) => i.level === ValidationLevel.Error).length

  const handleSelectionChange = (rowIndex: number, columnName: string): void => {
    setStatusBar({
      currentSelection: `${formatCellAddress(rowIndex, columnName)}（第 ${rowIndex} 行，${columnName}）`
    })
  }

  return (
    <div className="page editor-page">
      <header className="page__header editor-page__header">
        <div>
          <h2>Excel 在线编辑</h2>
          <p>
            {importSession.fileName} · {importSession.sheetName} · {statusBar.totalRecords} 人
          </p>
        </div>
        <div className="editor-page__toolbar">
          <button type="button" className="btn btn--ghost-dark" onClick={undo} disabled={!canUndo}>
            撤销
          </button>
          <button type="button" className="btn btn--ghost-dark" onClick={redo} disabled={!canRedo}>
            恢复
          </button>
          <button type="button" className="btn btn--primary" onClick={markSaved}>
            保存
          </button>
          <Link
            to={AppRoute.CALCULATION}
            className={`btn btn--primary ${errorCount > 0 ? 'btn--disabled' : ''}`}
            aria-disabled={errorCount > 0}
            onClick={(event) => {
              if (errorCount > 0) {
                event.preventDefault()
              }
            }}
          >
            前往计算
          </Link>
        </div>
      </header>

      {isDirty && (
        <div className="editor-banner">
          当前数据未保存 — 修改已自动重新校验
        </div>
      )}

      <div className="editor-page__grid panel">
        <ExcelEditor
          gridRows={gridRows}
          validationIssues={validationIssues}
          focusTarget={focusTarget}
          onGridChange={updateGridRows}
          onSelectionChange={handleSelectionChange}
          onFocusHandled={clearFocusTarget}
        />
      </div>

      <p className="editor-page__hint">
        双击单元格编辑 · Ctrl+C/V 复制粘贴 · 点击右侧错误项可定位单元格
        {errorCount > 0 && ' · 存在错误时不可进入计算'}
      </p>
    </div>
  )
}
