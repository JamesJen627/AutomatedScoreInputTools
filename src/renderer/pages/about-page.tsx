import { useAppContext } from '@renderer/context/app-context'

export function AboutPage(): React.ReactElement {
  const { appInfo, appPaths } = useAppContext()

  return (
    <div className="page about-page">
      <header className="page__header">
        <h2>关于</h2>
      </header>
      <section className="panel">
        <h3>{appInfo?.nameZh}</h3>
        <p className="about-page__en">{appInfo?.name}</p>
        <dl className="summary-list">
          <div>
            <dt>版本</dt>
            <dd>v{appInfo?.version}</dd>
          </div>
          <div>
            <dt>许可证</dt>
            <dd>MIT</dd>
          </div>
          <div>
            <dt>开发者</dt>
            <dd>JamesJen627</dd>
          </div>
          <div>
            <dt>数据目录</dt>
            <dd className="mono">{appPaths?.userData ?? '-'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
