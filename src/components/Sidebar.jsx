import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ClipboardCheck,
  BarChart3,
  Settings,
  User,
  Moon,
  Sun,
  LogOut,
  X,
  PanelLeftClose,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import stlafLogo from '../../STLAF_LOGO.png'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tasks', icon: ClipboardCheck, label: 'Task Management' },
  { to: '/review', icon: ClipboardCheck, label: 'Review Panel' },
  { to: '/stats', icon: BarChart3, label: 'Team Stats' },
  { to: '/admin', icon: Settings, label: 'Admin Center', supervisorOnly: true },
  { to: '/account', icon: User, label: 'My Account' },
]

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { profile, isSupervisor, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Generate avatar initials from display name
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  async function handleLogout() {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Filter nav items by role
  const visibleNavItems = navItems.filter(
    item => !item.supervisorOnly || isSupervisor
  )

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col
        bg-navy-800 shadow-sidebar
        transform transition-transform duration-300 ease-in-out
        ${collapsed ? '-translate-x-full lg:-translate-x-full' : 'lg:translate-x-0'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header row: logo + close/collapse buttons */}
      <div className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-900 border border-white/10 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
            <img src={stlafLogo} alt="STLAF Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-base leading-tight truncate">
              Marketing Portal
            </h1>
            <p className="text-slate-400 text-[11px] font-medium tracking-[0.15em] uppercase mt-0.5">
              Marketing
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white transition-colors mt-1"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>

        {/* Desktop collapse button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex text-slate-400 hover:text-white transition-colors mt-1"
          aria-label="Collapse sidebar"
          title="Hide sidebar"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
              {item.supervisorOnly && (
                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                  SUP
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto">
        {/* Divider */}
        <div className="mx-4 border-t border-white/10" />

        <div className="px-4 py-4 space-y-3">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/30 border border-brand-400/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-brand-300 font-semibold text-xs">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile?.display_name || 'Loading...'}
              </p>
              <p className="text-slate-400 text-[11px] font-mono truncate">
                {profile ? `marketing_${profile.role}` : '...'}
              </p>
            </div>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-all duration-200"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            <div className="ml-auto relative">
              <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${darkMode ? 'bg-brand-500' : 'bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
