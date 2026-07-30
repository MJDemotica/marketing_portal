import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from profiles table
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession)
      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id)
        setProfile(userProfile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Login with email and password
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  // Logout
  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
    setSession(null)
  }

  // Update display name
  async function updateDisplayName(newName) {
    if (!profile) return

    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: newName, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  // Update avatar URL
  async function updateAvatarUrl(avatarUrl) {
    if (!profile) return

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  // Update password
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    login,
    logout,
    updateDisplayName,
    updateAvatarUrl,
    updatePassword,
    isSupervisor: profile?.role === 'supervisor',
    isMember: profile?.role === 'member',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
