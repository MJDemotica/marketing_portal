-- ============================================================
-- Marketing Portal — Phase 3: Full Task Visibility & Direct Completion
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow all authenticated Marketing members to view all Marketing department tasks
--    (and allow department accounts to view tasks where their department is the requester)
DROP POLICY IF EXISTS "Users can view department tasks or own tasks" ON tasks;
DROP POLICY IF EXISTS "Marketing members can view all marketing tasks" ON tasks;
CREATE POLICY "Marketing members can view all marketing tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    department = 'Marketing'
    OR department = get_user_department()
    OR requestor_id = auth.uid()
    OR assignee_id = auth.uid()
  );

-- 2. Allow Marketing team members and Supervisors to update and complete tasks directly
--    without requiring separate supervisor approval flags
DROP POLICY IF EXISTS "Members update own tasks, supervisors update department tasks" ON tasks;
DROP POLICY IF EXISTS "Marketing team can update marketing tasks" ON tasks;
CREATE POLICY "Marketing team can update marketing tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    department = 'Marketing'
    OR requestor_id = auth.uid()
    OR assignee_id = auth.uid()
    OR get_user_role() = 'supervisor'
  )
  WITH CHECK (
    department = 'Marketing'
    OR requestor_id = auth.uid()
    OR assignee_id = auth.uid()
    OR get_user_role() = 'supervisor'
  );

-- 3. Ensure status check constraint allows direct transitions to 'completed'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'for_review', 'revision', 'completed', 'disapproved'));
