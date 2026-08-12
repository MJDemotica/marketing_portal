import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from profiles table
  async function fetchProfile(userObj) {
    if (!userObj) return null
    const userId = userObj.id || userObj

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      const meta = userObj.user_metadata || userObj.raw_user_meta_data || {}
      const googleName = meta.full_name || meta.name || meta.display_name || userObj.email?.split('@')[0] || 'User'
      const googleAvatar = meta.avatar_url || meta.picture || null

      // If profile does not exist in DB yet, auto-create it as pending approval
      if (!data) {
        const { data: newProf, error: insErr } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            display_name: googleName,
            email: userObj.email,
            avatar_url: googleAvatar,
            role: 'member',
            department: 'Marketing',
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle()

        if (!insErr && newProf) {
          return newProf
        }

        // In-memory fallback profile so UI never hangs on Loading...
        return {
          id: userId,
          display_name: googleName,
          email: userObj.email,
          avatar_url: googleAvatar,
          role: 'member',
          department: 'Marketing',
          status: 'pending',
        }
      } else {
        // If profile exists but is missing avatar or display name from Google OAuth, sync it
        if ((!data.avatar_url && googleAvatar) || (!data.display_name && googleName)) {
          const { data: updatedProf } = await supabase
            .from('profiles')
            .update({
              avatar_url: data.avatar_url || googleAvatar,
              display_name: data.display_name || googleName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single()

          if (updatedProf) return updatedProf
        }
      }

      return data
    } catch (err) {
      console.error('Error fetching profile:', err)
      const meta = userObj.user_metadata || userObj.raw_user_meta_data || {}
      return {
        id: userId,
        display_name: meta.full_name || meta.name || userObj.email?.split('@')[0] || 'User',
        email: userObj.email,
        avatar_url: meta.avatar_url || meta.picture || null,
        role: 'member',
        department: 'Marketing',
      }
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession)
      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user)
        setProfile(userProfile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user)
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

  // Login with Google OAuth
  async function loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
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

  // Refetch profile (for checking approval status)
  async function refetchProfile() {
    if (!session?.user) return null
    const updated = await fetchProfile(session.user)
    setProfile(updated)
    return updated
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    login,
    loginWithGoogle,
    logout,
    updateDisplayName,
    updateAvatarUrl,
    updatePassword,
    refetchProfile,
    isSupervisor: profile?.role === 'supervisor',
    isMember: profile?.role === 'member',
    isPending: profile?.status === 'pending',
    isApproved: profile?.status === 'active' || profile?.status === 'approved' || !profile?.status,
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
