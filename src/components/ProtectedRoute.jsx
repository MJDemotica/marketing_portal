import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Clock, RefreshCw, LogOut } from 'lucide-react'
import stlafLogo from '../../STLAF_LOGO.png'

export default function ProtectedRoute({ children, requireSupervisor = false }) {
  const { session, profile, loading, isSupervisor, isPending, refetchProfile, logout } = useAuth()
  const [checking, setChecking] = useState(false)

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-navy-900">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Handle Pending Approval status
  if (isPending) {
    async function handleCheckStatus() {
      setChecking(true)
      try {
        await refetchProfile()
      } finally {
        setChecking(false)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 px-4">
        <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          {/* STLAF Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-navy-800/80 border border-white/10 p-2 shadow-xl mx-auto overflow-hidden">
            <img src={stlafLogo} alt="STLAF Logo" className="w-full h-full object-contain" />
          </div>

          {/* Pending Clock Icon */}
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
            <Clock size={28} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              Account Approval Pending
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your account <strong className="text-amber-300 font-mono">{session.user.email}</strong> has been registered and is currently pending review by a Marketing Supervisor.
            </p>
          </div>

          <div className="p-3.5 bg-navy-900/60 rounded-xl border border-white/10 text-[11px] text-slate-400 text-left space-y-1.5">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-amber-400 font-bold uppercase tracking-wider">Awaiting Review</span>
            </div>
            <div className="flex justify-between">
              <span>Account Type:</span>
              <span className="text-white capitalize">{profile?.role || 'Member'}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-lg"
            >
              {checking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={15} />}
              Check Approval Status
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-slate-300 hover:bg-white/5 text-xs font-semibold transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to home if supervisor access required but user is not a supervisor
  if (requireSupervisor && !isSupervisor) {
    return <Navigate to="/" replace />
  }

  return children
}
