-- ============================================================
-- Marketing Portal — Database Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('supervisor', 'member')),
  department TEXT NOT NULL DEFAULT 'Marketing',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'for_review', 'revision', 'completed')),
  requestor_id UUID REFERENCES profiles(id),
  department TEXT NOT NULL DEFAULT 'Marketing',
  assignee_id UUID REFERENCES profiles(id),
  due_date DATE,
  revision_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  fields JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_requestor ON tasks(requestor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS TEXT AS $$
  SELECT department FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- === Profiles policies ===
DROP POLICY IF EXISTS "Users can view profiles in their department" ON profiles;
CREATE POLICY "Users can view profiles in their department"
  ON profiles FOR SELECT
  USING (
    department = get_user_department()
    OR get_user_role() = 'supervisor'
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- === Tasks policies ===
DROP POLICY IF EXISTS "Members see own tasks, supervisors see department tasks" ON tasks;
CREATE POLICY "Members see own tasks, supervisors see department tasks"
  ON tasks FOR SELECT
  USING (
    CASE
      WHEN get_user_role() = 'supervisor' THEN department = get_user_department()
      ELSE (requestor_id = auth.uid() OR assignee_id = auth.uid())
    END
  );

DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Members update own tasks, supervisors update department tasks" ON tasks;
CREATE POLICY "Members update own tasks, supervisors update department tasks"
  ON tasks FOR UPDATE
  USING (
    CASE
      WHEN get_user_role() = 'supervisor' THEN department = get_user_department()
      ELSE (requestor_id = auth.uid() OR assignee_id = auth.uid())
    END
  );

DROP POLICY IF EXISTS "Supervisors can delete department tasks" ON tasks;
CREATE POLICY "Supervisors can delete department tasks"
  ON tasks FOR DELETE
  USING (
    get_user_role() = 'supervisor' AND department = get_user_department()
  );

-- === Comments policies ===
DROP POLICY IF EXISTS "Users can view comments on visible tasks" ON comments;
CREATE POLICY "Users can view comments on visible tasks"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = comments.task_id
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- === Activity logs policies ===
DROP POLICY IF EXISTS "Users can view logs for visible tasks" ON activity_logs;
CREATE POLICY "Users can view logs for visible tasks"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = activity_logs.task_id
    )
  );

DROP POLICY IF EXISTS "System can create activity logs" ON activity_logs;
CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- === Notifications policies ===
DROP POLICY IF EXISTS "Users see their own notifications" ON notifications;
CREATE POLICY "Users see their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- === Templates policies ===
DROP POLICY IF EXISTS "All authenticated users can view templates" ON templates;
CREATE POLICY "All authenticated users can view templates"
  ON templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Supervisors can manage templates" ON templates;
CREATE POLICY "Supervisors can manage templates"
  ON templates FOR INSERT
  WITH CHECK (get_user_role() = 'supervisor');

DROP POLICY IF EXISTS "Supervisors can update templates" ON templates;
CREATE POLICY "Supervisors can update templates"
  ON templates FOR UPDATE
  USING (get_user_role() = 'supervisor');

DROP POLICY IF EXISTS "Supervisors can delete templates" ON templates;
CREATE POLICY "Supervisors can delete templates"
  ON templates FOR DELETE
  USING (get_user_role() = 'supervisor');

-- === Departments policies ===
DROP POLICY IF EXISTS "All authenticated users can view departments" ON departments;
CREATE POLICY "All authenticated users can view departments"
  ON departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' IN ('supervisor', 'member') THEN NEW.raw_user_meta_data->>'role'
      ELSE 'member'
    END,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'Marketing')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback so auth.users creation never fails even if profile insert has an edge case error
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Seed: Departments
-- ============================================================
INSERT INTO departments (name, email) VALUES
  ('Marketing', 'marketing@company.com'),
  ('Accounting', 'accounting@company.com'),
  ('Corporate', 'corporate@company.com'),
  ('HR', 'hr@company.com'),
  ('Litigation', 'litigation@company.com'),
  ('Operations', 'operations@company.com')
ON CONFLICT (name) DO NOTHING;
