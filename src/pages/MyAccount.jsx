import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Shield,
  Building2,
  Bell,
  Check,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function MyAccount() {
  const { profile, updateDisplayName, updatePassword } = useAuth()

  // Display name state
  const [newDisplayName, setNewDisplayName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState({
    commentOnRequest: true,
    statusChange: true,
    taskAssigned: false,
    weeklyDigest: false,
  })

  // Team directory state
  const [teamMembers, setTeamMembers] = useState([])
  const [departments, setDepartments] = useState([])

  // Initialize display name from profile
  useEffect(() => {
    if (profile?.display_name) {
      setNewDisplayName(profile.display_name)
    }
  }, [profile])

  // Load team members and departments
  useEffect(() => {
    async function loadDirectory() {
      // Fetch team members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', 'Marketing')
        .order('display_name')

      if (profiles) setTeamMembers(profiles)

      // Fetch departments
      const { data: depts } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (depts) setDepartments(depts)
    }

    loadDirectory()
  }, [])

  // Save display name
  async function handleSaveName(e) {
    e.preventDefault()
    if (!newDisplayName.trim()) return

    setNameLoading(true)
    setNameError('')
    setNameSuccess(false)

    try {
      await updateDisplayName(newDisplayName.trim())
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      setNameError(err.message || 'Failed to update name')
    } finally {
      setNameLoading(false)
    }
  }

  // Change password
  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match')
      return
    }

    setPwLoading(true)
    try {
      await updatePassword(newPassword)
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message || 'Failed to update password')
    } finally {
      setPwLoading(false)
    }
  }

  // Toggle notification pref
  function togglePref(key) {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Password validation checks
  const pw8Chars = newPassword.length >= 8
  const pwMatch = newPassword.length > 0 && newPassword === confirmPassword

  // Get initials
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const notificationItems = [
    { key: 'commentOnRequest', label: 'Notify me when a comment is posted on my request' },
    { key: 'statusChange', label: 'Notify me when my request status changes' },
    { key: 'taskAssigned', label: 'Notify me when a task is assigned to me' },
    { key: 'weeklyDigest', label: 'Weekly digest of team activity' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          My Account
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your profile and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/15 border-2 border-brand-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-500 dark:text-brand-400 font-bold text-xl">
              {initials}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-800 dark:text-white">
              {profile?.display_name || 'Loading...'}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Mail size={14} />
              <span>{profile?.email || '...'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                <Shield size={11} />
                {profile?.role === 'supervisor' ? 'Supervisor' : 'Member'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-200 text-slate-600 dark:bg-navy-600 dark:text-slate-300">
                <Building2 size={11} />
                {profile?.department || 'Marketing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Display Name */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Change Display Name
        </h3>
        <form onSubmit={handleSaveName} className="flex items-end gap-3 max-w-md">
          <div className="flex-1">
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={nameLoading || !newDisplayName.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {nameLoading && <Loader2 size={14} className="animate-spin" />}
            Save Name
          </button>
        </form>
        {nameSuccess && (
          <div className="flex items-center gap-2 mt-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 size={15} />
            Display name updated successfully!
          </div>
        )}
        {nameError && (
          <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
            <AlertCircle size={15} />
            {nameError}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="max-w-md space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-700 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-700 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-700 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
          />
          {/* Password rules */}
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-2 text-xs">
              {pw8Chars ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <X size={14} className="text-slate-300 dark:text-slate-600" />
              )}
              <span className={pw8Chars ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {pwMatch ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <X size={14} className="text-slate-300 dark:text-slate-600" />
              )}
              <span className={pwMatch ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}>
                Passwords must match
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={pwLoading || !pw8Chars || !pwMatch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors mt-2"
          >
            {pwLoading && <Loader2 size={14} className="animate-spin" />}
            Update Password
          </button>
        </form>
        {pwSuccess && (
          <div className="flex items-center gap-2 mt-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 size={15} />
            Password updated successfully!
          </div>
        )}
        {pwError && (
          <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
            <AlertCircle size={15} />
            {pwError}
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Notification Preferences
          </h3>
        </div>
        <div className="space-y-3">
          {notificationItems.map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => togglePref(item.key)}
                className="relative ml-4 flex-shrink-0"
                role="switch"
                aria-checked={notifPrefs[item.key]}
              >
                <div
                  className={`w-10 rounded-full transition-colors duration-200 ${notifPrefs[item.key] ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  style={{ height: '22px' }}
                >
                  <div
                    className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200 ${notifPrefs[item.key] ? 'translate-x-[20px]' : 'translate-x-0.5'}`}
                  />
                </div>
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* User Directory */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
          User Directory
        </h3>

        {/* Marketing Team */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500 mb-3">
            Marketing Team
          </p>
          {teamMembers.length > 0 ? (
            <div className="space-y-2">
              {teamMembers.map((member) => {
                const memberInitials = member.display_name
                  ? member.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : '??'
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-50 dark:hover:bg-navy-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-400/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-500 dark:text-brand-400 font-semibold text-xs">
                          {memberInitials}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {member.display_name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        member.role === 'supervisor'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {member.role === 'supervisor' ? 'Supervisor' : 'Member'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-200 text-slate-600 dark:bg-navy-600 dark:text-slate-400">
                        {member.department}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
              No team members found. Set up Supabase and create user accounts.
            </p>
          )}
        </div>

        {/* Departments */}
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500 mb-3">
            Departments
          </p>
          {departments.length > 0 ? (
            <div className="space-y-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-50 dark:hover:bg-navy-600/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-600 flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {dept.name}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{dept.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-200 text-slate-600 dark:bg-navy-600 dark:text-slate-400">
                      Department
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
              No departments found. Run the SQL migration to seed departments.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
