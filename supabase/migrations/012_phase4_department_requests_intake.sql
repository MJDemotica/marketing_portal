-- ============================================================
-- Marketing Portal — Phase 4: Department Request Intake Schema & Policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add optional columns to tasks table for department requests
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- 2. Update task status check constraint to support department intake statuses
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN (
    'pending', 
    'pending_supervisor_review', 
    'submitted_by_department', 
    'assigned', 
    'in_progress', 
    'for_review', 
    'revision', 
    'completed', 
    'disapproved'
  ));

-- 3. Ensure Department accounts can SELECT tasks belonging to their department
DROP POLICY IF EXISTS "Marketing members can view all marketing tasks" ON tasks;
DROP POLICY IF EXISTS "Department and Marketing task select policy" ON tasks;
CREATE POLICY "Department and Marketing task select policy"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    department = 'Marketing'
    OR department = get_user_department()
    OR requestor_id = auth.uid()
    OR assignee_id = auth.uid()
    OR get_user_role() = 'supervisor'
  );

-- 4. Ensure Department accounts can INSERT new marketing requests
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
