import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '@renderer/context/app-context'
import { ValidationLevel } from '@shared/models'
import { AppRoute } from '@shared/types/app-state'

export function ImportPage(): React.ReactElement {
  const navigate = useNavigate()
  const {
    importSession,
    validationIssues,
    students,
    isImporting,
    importError,
    importExcel,
    workflowState,
    statusBar
  } = useAppContext()

  const errorCount = validationIssues.filter((i) => i.level === ValidationLevel.Error).length
  const canCalculate = importSession?.passed === true && errorCount === 0

  const handleImport = async (): Promise<void> => {
    const result = await importExcel()
    if (result?.success) {
      navigate(AppRoute.EDITOR)
    }
  }

  return (
    <div className="page import-page">
      <header className="page__header">
        <h2>导入成绩</h2>
        <p>支持 .xlsx / .xls，导入后自动执行表头与数据检查，并进入在线编辑器。</p>
      </header>

      <div className="page-placeholder__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void handleImport()}
          disabled={isImporting}
        >
          {isImporting ? '导入中…' : '选择 Excel 文件'}
        </button>
        {importSession && (
          <Link to={AppRoute.EDITOR} className="btn btn--ghost-dark">
            打开编辑器
          </Link>
        )}
      </div>

      {importError && (
        <div className="message message--error panel">
          <strong>导入失败</strong>
          <p>{importError}</p>
        </div>
      )}

      {importSession && (
        <section className="panel import-summary">
          <h3>导入结果</h3>
          <dl className="summary-list">
            <div>
              <dt>文件名</dt>
              <dd>{importSession.fileName}</dd>
            </div>
            <div>
              <dt>工作表</dt>
              <dd>{importSession.sheetName}</dd>
            </div>
            <div>
              <dt>学生人数</dt>
              <dd>{students.length}</dd>
            </div>
            <div>
              <dt>导入时间</dt>
              <dd>{new Date(importSession.importedAt).toLocaleString('zh-CN')}</dd>
            </div>
            <div>
              <dt>检查状态</dt>
              <dd>{statusBar.dataStatus}</dd>
            </div>
            <div>
              <dt>流程状态</dt>
              <dd>{workflowState}</dd>
            </div>
            <div>
              <dt>允许计算</dt>
              <dd>{canCalculate ? '是' : '否（请先修复错误）'}</dd>
            </div>
          </dl>
        </section>
      )}

      {students.length > 0 && (
        <section className="panel import-preview">
          <h3>数据预览（前 5 行）</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>行</th>
                  <th>班级</th>
                  <th>学号</th>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>50m</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 5).map((student) => (
                  <tr key={student.rowIndex}>
                    <td>{student.rowIndex}</td>
                    <td>{student.className}</td>
                    <td>{student.studentNumber}</td>
                    <td>{student.name}</td>
                    <td>{student.gender}</td>
                    <td>{student.run50}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
