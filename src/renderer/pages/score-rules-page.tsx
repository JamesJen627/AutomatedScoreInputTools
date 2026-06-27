import { useAppContext } from '@renderer/context/app-context'

export function ScoreRulesPage(): React.ReactElement {
  const { scoreRulePlugins, activeScoreRule, activateScoreRule, refreshScoreRules } = useAppContext()

  return (
    <div className="page score-rules-page">
      <header className="page__header">
        <h2>评分标准管理</h2>
        <p>ScoreRules 插件目录：manifest.json + rule.xlsx（PRD §7）</p>
      </header>

      <div className="page-placeholder__actions">
        <button type="button" className="btn btn--ghost-dark" onClick={() => void refreshScoreRules()}>
          刷新列表
        </button>
      </div>

      {activeScoreRule && (
        <section className="panel">
          <h3>当前评分标准</h3>
          <dl className="summary-list">
            <div>
              <dt>名称</dt>
              <dd>{activeScoreRule.manifest.name}</dd>
            </div>
            <div>
              <dt>版本</dt>
              <dd>{activeScoreRule.manifest.version}</dd>
            </div>
            <div>
              <dt>发布单位</dt>
              <dd>{activeScoreRule.manifest.author}</dd>
            </div>
            <div>
              <dt>路径</dt>
              <dd className="mono">{activeScoreRule.pluginPath}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="panel score-rules-list">
        <h3>已安装插件</h3>
        {scoreRulePlugins.length === 0 ? (
          <p className="empty-hint">未找到评分标准插件。请确认 ScoreRules 目录已复制到用户数据目录。</p>
        ) : (
          <ul className="plugin-list">
            {scoreRulePlugins.map((plugin) => (
              <li key={plugin.id} className={`plugin-card ${plugin.isActive ? 'plugin-card--active' : ''}`}>
                <div>
                  <strong>{plugin.name}</strong>
                  <span className="plugin-card__version">v{plugin.version}</span>
                  {!plugin.isValid && (
                    <span className="plugin-card__badge plugin-card__badge--error">无效</span>
                  )}
                  {plugin.isActive && (
                    <span className="plugin-card__badge plugin-card__badge--active">当前使用</span>
                  )}
                </div>
                {plugin.errorMessage && <p className="plugin-card__error">{plugin.errorMessage}</p>}
                <p className="mono plugin-card__path">{plugin.pluginPath}</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={!plugin.isValid || plugin.isActive}
                  onClick={() => void activateScoreRule(plugin.pluginPath)}
                >
                  {plugin.isActive ? '已激活' : '切换到此标准'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
