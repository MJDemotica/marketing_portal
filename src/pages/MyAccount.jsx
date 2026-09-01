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
  Camera,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function MyAccount() {
  const { profile, updateDisplayName, updateAvatarUrl, updatePassword } = useAuth()

  // Avatar upload state
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarSuccess, setAvatarSuccess] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError('')
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        setAvatarLoading(true)
        await updateAvatarUrl(reader.result)
        setAvatarSuccess(true)
        setTimeout(() => setAvatarSuccess(false), 3000)
      } catch (err) {
        setAvatarError(err.message || 'Failed to update photo')
      } finally {
        setAvatarLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

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
    <div className="space-y-6 max-w-7xl">



      {/* 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Account Settings (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Profile Overview</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar with click & hover upload overlay */}
              <label className="relative w-20 h-20 rounded-full bg-brand-500/15 border-2 border-brand-400/30 flex items-center justify-center flex-shrink-0 cursor-pointer group overflow-hidden shadow-md">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-brand-500 dark:text-brand-400 font-bold text-xl">
                    {initials}
                  </span>
                )}

                {/* Hover overlay with camera icon */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                  <Camera size={18} />
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Change</span>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                    {profile?.display_name || 'Loading...'}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                  <Mail size={13} />
                  <span className="font-mono truncate">{profile?.email || '...'}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      profile?.role === 'supervisor'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                    }`}
                  >
                    <Shield size={11} />
                    {profile?.role === 'supervisor' ? 'Supervisor' : 'Member'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-200 text-slate-600 dark:bg-navy-600 dark:text-slate-400">
                    <Building2 size={11} />
                    {profile?.department || 'Marketing'}
                  </span>
                </div>

                {avatarLoading && (
                  <p className="text-xs text-brand-500 flex items-center gap-1 pt-1">
                    <Loader2 size={12} className="animate-spin" />
                    Updating photo...
                  </p>
                )}
                {avatarSuccess && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 pt-1 font-semibold">
                    <CheckCircle2 size={13} />
                    Profile photo updated!
                  </p>
                )}
                {avatarError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 pt-1">
                    <AlertCircle size={13} />
                    {avatarError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Change Display Name */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Change Display Name
            </h3>
            <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="flex-1 px-3.5 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button
                type="submit"
                disabled={nameLoading || !newDisplayName.trim() || newDisplayName === profile?.display_name}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {nameLoading && <Loader2 size={14} className="animate-spin" />}
                Save Name
              </button>
            </form>
            {nameSuccess && (
              <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-green-600 dark:text-green-400">
                <CheckCircle2 size={14} />
                Display name updated!
              </div>
            )}
            {nameError && (
              <div className="flex items-center gap-2 mt-3 text-xs text-red-500">
                <AlertCircle size={14} />
                {nameError}
              </div>
            )}
          </div>

          {/* Security & Password */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-3.5 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="px-3.5 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="px-3.5 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              {/* Password checklist */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  {pw8Chars ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <X size={14} className="text-slate-300 dark:text-slate-600" />
                  )}
                  <span className={pw8Chars ? 'text-green-600 dark:text-green-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {pwMatch ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <X size={14} className="text-slate-300 dark:text-slate-600" />
                  )}
                  <span className={pwMatch ? 'text-green-600 dark:text-green-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                    Passwords must match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={pwLoading || !pw8Chars || !pwMatch}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors mt-2"
              >
                {pwLoading && <Loader2 size={14} className="animate-spin" />}
                Update Password
              </button>
            </form>

            {pwSuccess && (
              <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-green-600 dark:text-green-400">
                <CheckCircle2 size={15} />
                Password updated successfully!
              </div>
            )}
            {pwError && (
              <div className="flex items-center gap-2 mt-3 text-xs text-red-500">
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
        </div>

        {/* RIGHT COLUMN: Roster & System Overview (1 col) */}
        <div className="space-y-6">
          {/* System Authority Card */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                System Privileges
              </h4>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Active Session" />
            </div>

            <div className="p-3 bg-surface-50 dark:bg-navy-800/60 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Role Level:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                  {profile?.role || 'Member'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Department:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {profile?.department || 'Marketing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Session:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Authenticated
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              {profile?.role === 'supervisor'
                ? 'Supervisors have full permission to create tasks, assign work, approve reviews, and manage team members.'
                : 'Members can view assigned tasks, update work statuses, post comments, and submit completed tasks for review.'}
            </p>
          </div>

          {/* User Directory Roster */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                Marketing Roster
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold">
                {teamMembers.length} Members
              </span>
            </div>

            {teamMembers.length > 0 ? (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {teamMembers.map((member) => {
                  const memberInitials = member.display_name
                    ? member.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : '??'
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-50/50 dark:bg-navy-800/40 border border-surface-100 dark:border-navy-700/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-400/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-brand-500 dark:text-brand-400 font-bold text-xs">
                              {memberInitials}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {member.display_name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          member.role === 'supervisor'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                        }`}
                      >
                        {member.role === 'supervisor' ? 'Sup' : 'Mem'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                No team members found.
              </p>
            )}

            {/* Departments */}
            <div className="pt-2 border-t border-surface-200 dark:border-navy-700">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2">
                Active Departments ({departments.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {departments.map((dept) => (
                  <span
                    key={dept.id}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-surface-200 dark:border-navy-700"
                  >
                    {dept.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
