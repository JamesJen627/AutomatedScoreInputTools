import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@shared/types/app-state'
import { useAppContext } from '@renderer/context/app-context'

interface LeftSidebarProps {
  readonly collapsed: boolean
}

export function LeftSidebar({ collapsed }: LeftSidebarProps): React.ReactElement {
  const { toggleSidebar } = useAppContext()

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar__toggle btn btn--ghost"
        onClick={toggleSidebar}
        aria-label={collapsed ? '展开菜单' : '收起菜单'}
      >
        {collapsed ? '»' : '«'}
      </button>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={item.label}
          >
            <span className="sidebar__icon" aria-hidden="true">
              {item.icon.slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
