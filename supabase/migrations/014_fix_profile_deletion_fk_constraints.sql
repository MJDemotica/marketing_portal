-- ============================================================
-- Marketing Portal — Fix FK constraints for profile deletion
-- Run this in Supabase SQL Editor
-- ============================================================
-- Problem: Deleting a profile fails when they have tasks as
-- requestor or assignee, because the FK defaults to RESTRICT.
--
-- Fix: Change to ON DELETE SET NULL so tasks are preserved
-- but the reference becomes NULL when a member is removed.
-- Also handle comments, activity_logs, and notifications.

-- 1. tasks.requestor_id → SET NULL on delete
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_requestor_id_fkey;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_requestor_id_fkey
  FOREIGN KEY (requestor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. tasks.assignee_id → SET NULL on delete
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_assignee_id_fkey
  FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. comments.user_id → SET NULL on delete (preserve comment history)
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. activity_logs.user_id → SET NULL on delete
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5. templates.created_by → SET NULL on delete
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_created_by_fkey;
ALTER TABLE templates
  ADD CONSTRAINT templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
