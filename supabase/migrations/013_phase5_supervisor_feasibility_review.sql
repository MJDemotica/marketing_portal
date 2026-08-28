-- ============================================================
-- Migration: Phase 5 — Supervisor Feasibility Review
-- Ensures supervisors can update department-submitted tasks
-- (approve & assign, or decline with reason)
-- ============================================================

-- 1. Ensure supervisors can UPDATE any task (including department intake requests)
--    This covers: setting status to 'assigned', setting assignee_id, or
--    setting status to 'disapproved' and storing decline_reason.
DROP POLICY IF EXISTS "Supervisors can update any task" ON tasks;
CREATE POLICY "Supervisors can update any task"
  ON tasks FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'supervisor')
  WITH CHECK (get_user_role() = 'supervisor');

-- 2. Ensure marketing members can also update tasks they are assigned to
--    or tasks in their department
DROP POLICY IF EXISTS "Marketing members can update tasks" ON tasks;
CREATE POLICY "Marketing members can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    get_user_department() = 'Marketing'
    AND (
      assignee_id = auth.uid()
      OR requestor_id = auth.uid()
      OR department = 'Marketing'
    )
  )
  WITH CHECK (
    get_user_department() = 'Marketing'
  );
