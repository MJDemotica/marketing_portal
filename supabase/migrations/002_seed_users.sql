-- ============================================================
-- Marketing Portal — Seed Test Users
-- Run this in Supabase SQL Editor AFTER running 001_schema.sql
-- ============================================================
-- 
-- IMPORTANT: You must create these users via the Supabase Dashboard
-- or Auth API first, then this script updates their profiles.
--
-- Test accounts to create in Supabase Auth (Dashboard > Authentication > Users > Add User):
--
--   1. Supervisor account:
--      Email: supervisor@company.com
--      Password: Password123!
--
--   2. Member account:
--      Email: member@company.com  
--      Password: Password123!
--
--   3. Additional team members (optional):
--      Email: alex.rivera@company.com    Password: Password123!
--      Email: maya.johnson@company.com   Password: Password123!
--      Email: david.park@company.com     Password: Password123!
--      Email: lisa.wang@company.com      Password: Password123!
--
-- After creating users in the Auth dashboard, run this to set roles:
-- ============================================================

INSERT INTO public.profiles (id, display_name, email, role, department)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), 
  email, 
  'member', 
  'Marketing'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles
SET display_name = 'Supervisor1', role = 'supervisor', department = 'Marketing'
WHERE email = 'stlaf_supervisor1@gmail.com';

UPDATE public.profiles
SET display_name = 'Member1', role = 'member', department = 'Marketing'
WHERE email = 'stlaf_member1@gmail.com';

-- Optional team members
UPDATE profiles 
SET display_name = 'Alex Rivera', role = 'member', department = 'Marketing'
WHERE email = 'alex.rivera@company.com';

UPDATE profiles 
SET display_name = 'Maya Johnson', role = 'member', department = 'Marketing'
WHERE email = 'maya.johnson@company.com';

UPDATE profiles 
SET display_name = 'David Park', role = 'member', department = 'Marketing'
WHERE email = 'david.park@company.com';

UPDATE profiles 
SET display_name = 'Lisa Wang', role = 'member', department = 'Marketing'
WHERE email = 'lisa.wang@company.com';
