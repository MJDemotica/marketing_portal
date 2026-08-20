-- ============================================================
-- Marketing Portal — Phase 1: Member Task & Template Permissions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow all authenticated Marketing members to INSERT templates (not just Supervisors)
DROP POLICY IF EXISTS "Supervisors can manage templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON templates;
CREATE POLICY "Authenticated users can create templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Allow template creators to UPDATE their own templates; Supervisors can update any
DROP POLICY IF EXISTS "Supervisors can update templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates or supervisors update any" ON templates;
CREATE POLICY "Users can update own templates or supervisors update any"
  ON templates FOR UPDATE
  USING (
    created_by = auth.uid()
    OR get_user_role() = 'supervisor'
  );

-- 3. Allow template creators to DELETE their own templates; Supervisors can delete any
DROP POLICY IF EXISTS "Supervisors can delete templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates or supervisors delete any" ON templates;
CREATE POLICY "Users can delete own templates or supervisors delete any"
  ON templates FOR DELETE
  USING (
    created_by = auth.uid()
    OR get_user_role() = 'supervisor'
  );

-- NOTE: The tasks INSERT policy already allows any authenticated user (001_schema.sql line 147-149).
-- No change needed for task creation RLS — only the frontend guard was removed.
