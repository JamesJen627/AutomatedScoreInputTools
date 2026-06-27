import { Link } from 'react-router-dom'
import { useAppContext } from '@renderer/context/app-context'
import { AppRoute } from '@shared/types/app-state'

const HOME_ACTIONS = [
  { route: AppRoute.IMPORT, label: '导入成绩', description: '导入 Excel 成绩文件并开始检查' },
  { route: AppRoute.SCORE_RULES, label: '评分标准', description: '管理 ScoreRules 插件与评分标准' },
  { route: AppRoute.CALCULATION, label: '开始计算', description: '检查通过后执行成绩计算与审核' },
  { route: AppRoute.LOGS, label: '日志', description: '查看历史计算与操作记录' },
  { route: AppRoute.SETTINGS, label: '设置', description: '配置路径、自动保存与系统参数' },
  { route: AppRoute.ABOUT, label: '关于', description: '版本信息与许可证' }
] as const

export function HomePage(): React.ReactElement {
  const { appInfo, statusBar, currentFileName } = useAppContext()

  return (
    <div className="page home-page">
      <header className="page__header">
        <h2>首页</h2>
        <p>导入 → 检查 → 编辑 → 计算 → 审核 → 导出</p>
      </header>

      <div className="home-page__cards">
        {HOME_ACTIONS.map((action) => (
          <Link key={action.route} to={action.route} className="home-card">
            <h3>{action.label}</h3>
            <p>{action.description}</p>
          </Link>
        ))}
      </div>

      <section className="home-page__summary panel">
        <h3>系统概览</h3>
        <dl className="summary-list">
          <div>
            <dt>软件版本</dt>
            <dd>v{appInfo?.version ?? '1.0.0'}</dd>
          </div>
          <div>
            <dt>当前评分标准</dt>
            <dd>{statusBar.scoreRuleName}</dd>
          </div>
          <div>
            <dt>最近导入文件</dt>
            <dd>{currentFileName}</dd>
          </div>
          <div>
            <dt>数据目录</dt>
            <dd className="mono">{appInfo?.userDataPath ?? '-'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
