import { useAppContext } from '@renderer/context/app-context'

export function TopNavBar(): React.ReactElement {
  const { appInfo, statusBar, currentFileName, toggleRightPanel } = useAppContext()

  return (
    <header className="top-nav">
      <div className="top-nav__brand">
        <span className="top-nav__logo" aria-hidden="true">
          ASIT
        </span>
        <div>
          <h1 className="top-nav__title">{appInfo?.nameZh ?? '体育成绩自动评分系统'}</h1>
          <p className="top-nav__subtitle">v{appInfo?.version ?? '1.0.0'}</p>
        </div>
      </div>

      <div className="top-nav__meta">
        <span>评分标准：{statusBar.scoreRuleName}</span>
        <span>当前文件：{currentFileName}</span>
      </div>

      <div className="top-nav__actions">
        <button type="button" className="btn btn--ghost" disabled title="V1.0 预留">
          检查更新
        </button>
        <button type="button" className="btn btn--ghost">
          帮助
        </button>
        <button type="button" className="btn btn--ghost" onClick={toggleRightPanel}>
          面板
        </button>
      </div>
    </header>
  )
}
