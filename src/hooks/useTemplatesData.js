import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTemplatesData() {
  const { profile, isSupervisor } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchErr } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setTemplates(data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Create a new template
  const createTemplate = async ({ name, fields }) => {
    try {
      const { data, error: insertErr } = await supabase
        .from('templates')
        .insert({
          name: name.trim(),
          fields: fields || {},
          created_by: profile?.id || null,
        })
        .select()
        .maybeSingle()

      if (insertErr) throw insertErr
      await fetchTemplates()
      return data
    } catch (err) {
      console.error('Error creating template:', err)
      throw err
    }
  }

  // Delete a template (own templates for Members, any for Supervisors)
  const deleteTemplate = async (templateId) => {
    try {
      const { error: delErr } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)

      if (delErr) throw delErr
      await fetchTemplates()
      return true
    } catch (err) {
      console.error('Error deleting template:', err)
      throw err
    }
  }

  // Check if current user can delete a given template
  const canDelete = (template) => {
    if (isSupervisor) return true
    return template.created_by === profile?.id
  }

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    deleteTemplate,
    canDelete,
  }
}
