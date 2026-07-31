-- ============================================================
-- Marketing Portal — Fix Supervisor Edit & Update RLS Permissions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create SECURITY DEFINER helper function (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'supervisor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Allow authenticated users to view profiles
DROP POLICY IF EXISTS "Users can view profiles in their department" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow users to insert profiles (self-signup or supervisor creation)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
CREATE POLICY "Users can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR is_supervisor());

-- 4. Allow users to update their own profile OR supervisors to update any member profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR is_supervisor())
  WITH CHECK (id = auth.uid() OR is_supervisor());

-- 5. Allow Supervisors to delete profiles
DROP POLICY IF EXISTS "Supervisors can delete profiles" ON profiles;
CREATE POLICY "Supervisors can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_supervisor());
