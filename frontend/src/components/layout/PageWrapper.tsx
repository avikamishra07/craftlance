import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children?: ReactNode
  showSidebar?: boolean
  className?: string
}

export function PageWrapper({ children, showSidebar = true, className }: PageWrapperProps) {
  const { isAuthenticated } = useAuthStore()
  const hasSidebar = showSidebar && isAuthenticated

  return (
    <div className="min-h-screen bg-surface-0">
      <Navbar />
      {hasSidebar && <Sidebar />}
      <main className={cn('pt-16 min-h-screen', hasSidebar && 'pl-56', className)}>
        <div className="p-6">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}

/** Full-bleed layout — auth/landing */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      {children}
    </div>
  )
}
