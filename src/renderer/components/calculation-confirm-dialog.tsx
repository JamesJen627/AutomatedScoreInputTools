import type { PreflightReport } from '@shared/types/preflight'

interface CalculationConfirmDialogProps {
  readonly report: PreflightReport
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

export function CalculationConfirmDialog({
  report,
  onConfirm,
  onCancel
}: CalculationConfirmDialogProps): React.ReactElement {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal panel" role="dialog" aria-modal="true" aria-labelledby="calc-confirm-title">
        <header className="modal__header">
          <h3 id="calc-confirm-title">即将开始成绩计算</h3>
          <p>Pre-flight Check 已通过，请确认以下信息。</p>
        </header>

        <dl className="summary-list modal__summary">
          <div>
            <dt>学生人数</dt>
            <dd>{report.studentCount}</dd>
          </div>
          <div>
            <dt>评分标准</dt>
            <dd>{report.scoreRuleName}</dd>
          </div>
          <div>
            <dt>错误</dt>
            <dd>{report.errorCount}</dd>
          </div>
          <div>
            <dt>警告</dt>
            <dd>{report.warningCount}</dd>
          </div>
          <div>
            <dt>预计耗时</dt>
            <dd>{(report.estimatedDurationMs / 1000).toFixed(1)} 秒</dd>
          </div>
        </dl>

        <ul className="preflight-list">
          {report.items.map((item) => (
            <li key={item.id} className={`preflight-item preflight-item--${item.level}`}>
              <span>{item.label}</span>
              <span>{item.passed ? '√' : '×'}</span>
              <span>{item.message}</span>
            </li>
          ))}
        </ul>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost-dark" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm}>
            开始计算
          </button>
        </div>
      </div>
    </div>
  )
}
