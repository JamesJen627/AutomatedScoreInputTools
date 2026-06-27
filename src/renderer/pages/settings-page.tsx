import { useAppContext } from '@renderer/context/app-context'
import { PagePlaceholder } from '@renderer/components/page-placeholder'

export function SettingsPage(): React.ReactElement {
  const { appPaths } = useAppContext()

  return (
    <div className="page">
      <PagePlaceholder
        title="设置"
        description="Phase 5：Configuration Manager 管理路径、自动保存、小数位等参数。"
      />
      {appPaths && (
        <section className="panel settings-paths">
          <h3>用户数据目录（已初始化）</h3>
          <ul className="path-list">
            <li>
              <span>配置</span>
              <code>{appPaths.config}</code>
            </li>
            <li>
              <span>日志</span>
              <code>{appPaths.logs}</code>
            </li>
            <li>
              <span>缓存</span>
              <code>{appPaths.cache}</code>
            </li>
            <li>
              <span>自动保存</span>
              <code>{appPaths.autosave}</code>
            </li>
            <li>
              <span>评分标准</span>
              <code>{appPaths.scoreRules}</code>
            </li>
          </ul>
        </section>
      )}
    </div>
  )
}
