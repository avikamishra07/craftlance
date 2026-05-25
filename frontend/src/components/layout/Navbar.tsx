import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Search, ChevronDown, LogOut, User, Settings, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/lib/utils'

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.06] bg-surface-0/80 backdrop-blur-xl"
    >
      <div className="flex h-full items-center px-6 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Craftlance</span>
        </Link>

        {/* Nav links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Browse', href: '/projects' },
              { label: 'Community', href: '/community' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-md transition-all duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        {/* Search */}
        {isAuthenticated && (
          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-surface-2 border border-white/[0.06] rounded-lg hover:border-white/[0.12] transition-all duration-150 w-52">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Search...</span>
            <span className="ml-auto text-xs bg-surface-3 px-1.5 py-0.5 rounded">⌘K</span>
          </button>
        )}

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-all">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-400 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
                <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-semibold text-white">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-foreground leading-none">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 w-52 glass rounded-xl border border-white/[0.08] py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-glass">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-xs font-medium text-foreground">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                {[
                  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
                  { icon: User, label: 'Profile', href: '/profile' },
                  { icon: Settings, label: 'Settings', href: '/settings' },
                ].map(({ icon: Icon, label, href }) => (
                  <Link
                    key={href}
                    to={href}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-white/[0.06] mt-1.5 pt-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-sm font-medium bg-brand-500 hover:bg-brand-400 text-white rounded-lg transition-all duration-150 shadow-glow-sm"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </motion.header>
  )
}
