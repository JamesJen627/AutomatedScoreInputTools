import { Link } from 'react-router-dom'
import { CalculationConfirmDialog } from '@renderer/components/calculation-confirm-dialog'
import { useAppContext } from '@renderer/context/app-context'
import { ValidationLevel } from '@shared/models'
import { AppRoute } from '@shared/types/app-state'

export function CalculationPage(): React.ReactElement {
  const {
    students,
    validationIssues,
    activeScoreRule,
    calculationReport,
    auditReport,
    auditPassed,
    isCalculating,
    calculationError,
    isExporting,
    exportError,
    lastExportFileName,
    showCalculationConfirm,
    preflightReport,
    statusBar,
    selectedTraceRowIndex,
    requestCalculation,
    cancelCalculationConfirm,
    confirmAndRunCalculation,
    exportExcel,
    setSelectedTraceRowIndex
  } = useAppContext()

  const errorCount = validationIssues.filter((i) => i.level === ValidationLevel.Error).length
  const canCalculate = students.length > 0 && errorCount === 0 && activeScoreRule !== null
  const canExport = auditPassed === true && calculationReport !== null && calculationReport.failedCount === 0

  const selectedResult =
    calculationReport?.results.find((result) => result.rowIndex === selectedTraceRowIndex) ??
    calculationReport?.results[0]

  return (
    <div className="page calculation-page">
      {showCalculationConfirm && preflightReport && (
        <CalculationConfirmDialog
          report={preflightReport}
          onConfirm={() => void confirmAndRunCalculation()}
          onCancel={cancelCalculationConfirm}
        />
      )}

      <header className="page__header calculation-page__header">
        <div>
          <h2>成绩计算</h2>
          <p>
            评分标准：{activeScoreRule?.manifest.name ?? '未加载'} · 学生 {students.length} 人
          </p>
        </div>
        <div className="page-placeholder__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canCalculate || isCalculating}
            onClick={requestCalculation}
          >
            {isCalculating ? '计算中…' : '开始计算'}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canExport || isExporting}
            onClick={() => void exportExcel()}
          >
            {isExporting ? '导出中…' : '导出 Excel'}
          </button>
          {!activeScoreRule && (
            <Link to={AppRoute.SCORE_RULES} className="btn btn--ghost-dark">
              加载评分标准
            </Link>
          )}
          {students.length === 0 && (
            <Link to={AppRoute.IMPORT} className="btn btn--ghost-dark">
              导入成绩
            </Link>
          )}
        </div>
      </header>

      {!canCalculate && (
        <div className="message message--warning panel">
          {students.length === 0 && <p>请先导入并检查成绩数据。</p>}
          {errorCount > 0 && <p>存在 {errorCount} 个错误，请先在编辑器中修复。</p>}
          {!activeScoreRule && <p>未加载评分标准，请先激活 ScoreRules 插件。</p>}
        </div>
      )}

      {calculationError && (
        <div className="message message--error panel">
          <strong>计算失败</strong>
          <p>{calculationError}</p>
        </div>
      )}

      {exportError && (
        <div className="message message--error panel">
          <strong>导出失败</strong>
          <p>{exportError}</p>
        </div>
      )}

      {lastExportFileName && (
        <div className="message message--success panel">
          已成功导出：<strong>{lastExportFileName}</strong>
        </div>
      )}

      {calculationReport && calculationReport.failedCount > 0 && (
        <div className="message message--error panel">
          <strong>部分学生计算失败（{calculationReport.failedCount} 人）</strong>
          <p>常见原因：班级年级与评分标准不匹配（如 701 班需「初一」规则）。请重新导入并检查成绩，或在「评分标准」页刷新插件。</p>
          <ul className="audit-list">
            {calculationReport.results
              .filter((result) => !result.success)
              .map((result) => (
                <li key={result.rowIndex} className="audit-item">
                  <strong>第 {result.rowIndex} 行 · {result.name}</strong>
                  <p>{result.errorMessage ?? '未知错误'}</p>
                </li>
              ))}
          </ul>
        </div>
      )}

      {calculationReport && (
        <section className="panel calc-summary">
          <h3>计算报告</h3>
          <dl className="summary-list">
            <div>
              <dt>耗时</dt>
              <dd>{calculationReport.durationMs} ms</dd>
            </div>
            <div>
              <dt>成功</dt>
              <dd>{calculationReport.successCount} / {calculationReport.totalStudents}</dd>
            </div>
            <div>
              <dt>计算状态</dt>
              <dd>{statusBar.calculationStatus}</dd>
            </div>
            <div>
              <dt>审核结果</dt>
              <dd className={auditPassed ? 'text-success' : 'text-error'}>
                {auditPassed ? '审核通过（二次计算一致）' : '审核失败'}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {auditReport && !auditReport.auditPassed && auditReport.differences.length > 0 && (
        <section className="panel audit-panel">
          <h3>审核差异（{auditReport.differenceCount}）</h3>
          <ul className="audit-list">
            {auditReport.differences.map((diff, index) => (
              <li key={`${diff.rowIndex}-${diff.field}-${index}`} className="audit-item">
                <strong>第 {diff.rowIndex} 行 · {diff.name}</strong>
                <p>{diff.reason}</p>
              </li>
            ))}
          </ul>
          <p className="audit-blocked">审核未通过，已禁止导出。</p>
        </section>
      )}

      {calculationReport && (
        <section className="panel calc-results">
          <h3>计算结果</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>行</th>
                  <th>学号</th>
                  <th>姓名</th>
                  <th>体前屈</th>
                  <th>800m</th>
                  <th>50m</th>
                  <th>跳远</th>
                  <th>仰卧起坐</th>
                  <th>总成绩</th>
                  <th>轨迹</th>
                </tr>
              </thead>
              <tbody>
                {calculationReport.results.map((result) => (
                  <tr key={result.rowIndex}>
                    <td>{result.rowIndex}</td>
                    <td>{result.studentNumber}</td>
                    <td>{result.name}</td>
                    <td>{result.sitReachScore}</td>
                    <td>{result.run800Score}</td>
                    <td>{result.run50Score}</td>
                    <td>{result.standingJumpScore}</td>
                    <td>{result.sitUpScore}</td>
                    <td><strong>{result.totalScore.toFixed(2)}</strong></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost-dark btn--sm"
                        onClick={() => setSelectedTraceRowIndex(result.rowIndex)}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedResult && selectedResult.traces.length > 0 && (
        <section className="panel calc-trace">
          <h3>
            计算轨迹 — {selectedResult.name}（第 {selectedResult.rowIndex} 行）
          </h3>
          <div className="trace-list">
            {selectedResult.traces.map((trace) => (
              <article key={trace.itemCode} className="trace-item">
                <h4>{trace.itemLabel}</h4>
                <ol>
                  <li>成绩：{trace.performanceDisplay}</li>
                  <li>评分方向：{trace.strategy === 'higher_is_better' ? 'Higher Is Better' : 'Lower Is Better'}</li>
                  <li>命中标准：{trace.matchedPerformanceDisplay}</li>
                  <li>得分：{trace.itemScore}</li>
                  <li>占比：{trace.weightPercent}% → 权重 {trace.weightFactor}</li>
                  <li>贡献分：{trace.contributionScore.toFixed(2)}</li>
                </ol>
              </article>
            ))}
            <p className="trace-total">总成绩：{selectedResult.totalScore.toFixed(2)}</p>
          </div>
        </section>
      )}
    </div>
  )
}
