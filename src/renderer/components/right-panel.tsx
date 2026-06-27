import { useAppContext } from '@renderer/context/app-context'
import { ValidationLevel } from '@shared/models'
import { formatCellAddress } from '@shared/utils'

export function RightPanel(): React.ReactElement {
  const { statusBar, validationIssues, focusIssue } = useAppContext()

  const errors = validationIssues.filter((issue) => issue.level === ValidationLevel.Error)
  const warnings = validationIssues.filter((issue) => issue.level === ValidationLevel.Warning)

  return (
    <aside className="right-panel">
      <header className="right-panel__header">
        <h2>错误面板</h2>
        <p className="right-panel__hint">点击问题定位到对应单元格</p>
      </header>
      <div className="right-panel__stats">
        <div>
          <span>总人数</span>
          <strong>{statusBar.totalRecords}</strong>
        </div>
        <div>
          <span>错误</span>
          <strong className="text-error">{statusBar.errorCount}</strong>
        </div>
        <div>
          <span>警告</span>
          <strong className="text-warning">{statusBar.warningCount}</strong>
        </div>
      </div>

      {validationIssues.length === 0 ? (
        <div className="right-panel__empty">
          <p>暂无错误</p>
          <p>导入并检查成绩后将在此显示问题列表</p>
        </div>
      ) : (
        <div className="right-panel__lists">
          {errors.length > 0 && (
            <section className="issue-group">
              <h3>错误（{errors.length}）</h3>
              <ul>
                {errors.map((issue, index) => (
                  <li key={`e-${issue.rowIndex}-${issue.columnName}-${index}`}>
                    <button
                      type="button"
                      className="issue-item issue-item--error issue-item--clickable"
                      onClick={() => focusIssue(issue)}
                    >
                      <strong>
                        第 {issue.rowIndex} 行 · {formatCellAddress(issue.rowIndex, issue.columnName)}
                      </strong>
                      <p>{issue.message}</p>
                      <small>{issue.suggestion}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {warnings.length > 0 && (
            <section className="issue-group">
              <h3>警告（{warnings.length}）</h3>
              <ul>
                {warnings.map((issue, index) => (
                  <li key={`w-${issue.rowIndex}-${issue.columnName}-${index}`}>
                    <button
                      type="button"
                      className="issue-item issue-item--warning issue-item--clickable"
                      onClick={() => focusIssue(issue)}
                    >
                      <strong>
                        第 {issue.rowIndex} 行 · {issue.columnName}
                      </strong>
                      <p>{issue.message}</p>
                      <small>{issue.suggestion}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </aside>
  )
}
