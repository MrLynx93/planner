import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  Users,
  User,
  Building2,
  Baby,
  Scale,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

const scheduleItems: NavItem[] = [
  { label: 'Groups', to: '/schedule/groups', icon: LayoutGrid },
  { label: 'Teachers', to: '/schedule/teachers', icon: User },
]

const managementItems: NavItem[] = [
  { label: 'Annexes', to: '/annexes', icon: Building2 },
  { label: 'Teachers', to: '/teachers', icon: Users },
  { label: 'Groups', to: '/groups', icon: LayoutGrid },
  { label: 'Children', to: '/children', icon: Baby },
  { label: 'Rules', to: '/rules', icon: Scale },
  { label: 'Closed Days', to: '/closed-days', icon: XCircle },
]

function SidebarSection({
  title,
  items,
  collapsed,
}: {
  title: string
  items: NavItem[]
  collapsed: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && (
        <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      )}
      {collapsed && <div className="mx-3 my-1 border-t border-border" />}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground/70',
              collapsed && 'justify-center px-2'
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </div>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-3',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Planner</span>
          </div>
        )}
        {collapsed && <CalendarDays className="h-5 w-5 text-primary" />}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed && 'mt-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2 py-3">
        <SidebarSection
          title="Schedule"
          items={scheduleItems}
          collapsed={collapsed}
        />
        <SidebarSection
          title="Management"
          items={managementItems}
          collapsed={collapsed}
        />
      </nav>
    </aside>
  )
}
