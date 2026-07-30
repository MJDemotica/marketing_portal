-- ============================================================
-- Marketing Portal — Add 'disapproved' to task status constraint
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'for_review', 'revision', 'completed', 'disapproved'));
