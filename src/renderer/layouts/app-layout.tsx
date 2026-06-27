import { Outlet } from 'react-router-dom'
import { TopNavBar } from '@renderer/components/top-nav-bar'
import { LeftSidebar } from '@renderer/components/left-sidebar'
import { RightPanel } from '@renderer/components/right-panel'
import { StatusBar } from '@renderer/components/status-bar'
import { useAppContext } from '@renderer/context/app-context'

export function AppLayout(): React.ReactElement {
  const { sidebarCollapsed, rightPanelCollapsed, initError, isInitializing } = useAppContext()

  if (isInitializing) {
    return (
      <div className="app-loading">
        <p>正在初始化应用…</p>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="app-loading app-loading--error">
        <h1>初始化失败</h1>
        <p>{initError}</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <TopNavBar />
      <div className="app-body">
        <LeftSidebar collapsed={sidebarCollapsed} />
        <main className="app-main">
          <Outlet />
        </main>
        {!rightPanelCollapsed && <RightPanel />}
      </div>
      <StatusBar />
    </div>
  )
}
