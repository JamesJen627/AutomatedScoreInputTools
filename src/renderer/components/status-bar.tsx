import { useAppContext } from '@renderer/context/app-context'

export function StatusBar(): React.ReactElement {
  const { statusBar } = useAppContext()

  return (
    <footer className="status-bar">
      <span>当前评分标准：{statusBar.scoreRuleName}</span>
      <span>数据状态：{statusBar.dataStatus}</span>
      <span>计算状态：{statusBar.calculationStatus}</span>
      <span>审核状态：{statusBar.auditStatus}</span>
      <span>自动保存：{statusBar.autoSaveEnabled ? '已开启' : '已关闭'}</span>
      <span>当前选择：{statusBar.currentSelection}</span>
      <span>总记录：{statusBar.totalRecords}</span>
      <span>错误：{statusBar.errorCount}</span>
      <span>警告：{statusBar.warningCount}</span>
    </footer>
  )
}
