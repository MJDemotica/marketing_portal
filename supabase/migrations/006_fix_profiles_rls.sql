-- ============================================================
-- Marketing Portal — Fix Profiles Row Level Security (RLS)
-- Run this in Supabase SQL Editor to allow Google OAuth auto-provisioning
-- ============================================================

-- 1. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow all authenticated users to view profiles in the directory
DROP POLICY IF EXISTS "Users can view profiles in their department" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow authenticated users to insert their own profile on signup/OAuth
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 4. Allow users to update their own profile (or supervisors to update any profile)
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'supervisor')
  WITH CHECK (id = auth.uid() OR get_user_role() = 'supervisor');

-- 5. Allow Supervisors to delete profiles from Admin Center
DROP POLICY IF EXISTS "Supervisors can delete profiles" ON profiles;
CREATE POLICY "Supervisors can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'supervisor');

