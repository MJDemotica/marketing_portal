import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminData() {
  const [members, setMembers] = useState([])
  const [templates, setTemplates] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch profiles
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name')

      if (pErr) throw pErr

      // 2. Fetch templates
      const { data: tmpls, error: tErr } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (tErr) throw tErr

      // 3. Fetch departments
      const { data: depts, error: dErr } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (dErr) throw dErr

      setMembers(profs || [])
      setTemplates(tmpls || [])
      setDepartments(depts || [])
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Add member profile manually
  const addMember = async ({ displayName, email, role, department }) => {
    try {
      // Create profile record (Note: for actual authentication login, user signs up or is created via Auth)
      const fakeId = genRandomUUID()
      const { data, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: fakeId,
          display_name: displayName.trim(),
          email: email.trim().toLowerCase(),
          role: role || 'member',
          department: department || 'Marketing',
        })
        .select()
        .single()

      if (insertErr) throw insertErr
      await fetchData()
      return data
    } catch (err) {
      console.error('Error adding member:', err)
      throw err
    }
  }

  // Update member role or department
  const updateMember = async (memberId, { displayName, role, department }) => {
    try {
      const { data, error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          role,
          department,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select()
        .single()

      if (updateErr) throw updateErr
      await fetchData()
      return data
    } catch (err) {
      console.error('Error updating member:', err)
      throw err
    }
  }

  // Delete member profile
  const deleteMember = async (memberId) => {
    try {
      const { error: delErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId)

      if (delErr) throw delErr
      await fetchData()
      return true
    } catch (err) {
      console.error('Error deleting member:', err)
      throw err
    }
  }

  // Create request template
  const createTemplate = async ({ name, fields }) => {
    try {
      const { data, error: insertErr } = await supabase
        .from('templates')
        .insert({
          name: name.trim(),
          fields: fields || {},
        })
        .select()
        .single()

      if (insertErr) throw insertErr
      await fetchData()
      return data
    } catch (err) {
      console.error('Error creating template:', err)
      throw err
    }
  }

  // Delete request template
  const deleteTemplate = async (templateId) => {
    try {
      const { error: delErr } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)

      if (delErr) throw delErr
      await fetchData()
      return true
    } catch (err) {
      console.error('Error deleting template:', err)
      throw err
    }
  }

  // Reset task data
  const resetTaskData = async () => {
    try {
      const { error: delErr } = await supabase
        .from('tasks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (delErr) throw delErr
      await fetchData()
      return true
    } catch (err) {
      console.error('Error resetting task data:', err)
      throw err
    }
  }

  return {
    members,
    templates,
    departments,
    loading,
    error,
    refetch: fetchData,
    addMember,
    updateMember,
    deleteMember,
    createTemplate,
    deleteTemplate,
    resetTaskData,
  }
}

// Fallback random UUID generator
function genRandomUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
