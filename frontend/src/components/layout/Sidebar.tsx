/**
 * Sidebar.tsx — M9 misc fix
 *
 * Active-state highlighting added for:
 *   /projects
 *   /dashboard/proposals
 *   /dashboard/projects
 *   /workspace/*
 *   /community          (new M9)
 *   /dashboard/saved    (new M9)
 *   /dashboard/skills   (M8)
 */
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, FileText, Briefcase,
  CreditCard, Star, Trophy, Users, Bookmark,
  MessageSquare, Settings, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to:      string
  label:   string
  icon:    React.ElementType
  /** If true, active when path STARTS WITH `to` (for nested routes) */
  prefix?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/projects',               label: 'Projects',     icon: FolderOpen,   prefix: true },
  { to: '/community',              label: 'Community',    icon: Users,        prefix: true },
  { to: '/dashboard/proposals',    label: 'Proposals',    icon: FileText },
  { to: '/dashboard/projects',     label: 'My Projects',  icon: Briefcase },
  { to: '/workspace',              label: 'Workspace',    icon: MessageSquare, prefix: true },
  { to: '/dashboard/saved',        label: 'Saved',        icon: Bookmark },
  { to: '/dashboard/skills',       label: 'Skills',       icon: Trophy },
  { to: '/dashboard/payments',     label: 'Payments',     icon: CreditCard },
  { to: '/dashboard/reviews',      label: 'Reviews',      icon: Star },
  { to: '/dashboard/settings',     label: 'Settings',     icon: Settings },
]

function SidebarLink({ item }: { item: NavItem }) {
  const location = useLocation()
  const Icon = item.icon

  // For prefix routes, manually check; otherwise use NavLink's default exact matching
  const isActive = item.prefix
    ? location.pathname.startsWith(item.to)
    : location.pathname === item.to

  return (
    <NavLink
      to={item.to}
      end={!item.prefix}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
        isActive
          ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/6',
      )}
    >
      <Icon
        size={16}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-brand-400' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      <span className="flex-1">{item.label}</span>
      {isActive && (
        <ChevronRight size={12} className="text-brand-400/60 shrink-0" />
      )}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <nav className="w-56 shrink-0 flex flex-col gap-0.5 py-2">
      {NAV_ITEMS.map(item => (
        <SidebarLink key={item.to} item={item} />
      ))}
    </nav>
  )
}
