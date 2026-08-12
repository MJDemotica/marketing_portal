-- ============================================================
-- Marketing Portal — Pending Account Approvals Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add status column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Ensure ALL existing profiles (supervisors & members) remain active
UPDATE profiles SET status = 'active' WHERE status IS NULL OR status = 'pending';

-- 3. Update handle_new_user() trigger so newly registered accounts start as 'pending'
--    - New signups (Google OAuth or email) → status = 'pending'
--    - Returning users (ON CONFLICT) → preserve existing status (don't reset active→pending)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, avatar_url, role, department, status)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
      NULLIF(NEW.raw_user_meta_data->>'picture', '')
    ),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' IN ('supervisor', 'member') THEN NEW.raw_user_meta_data->>'role'
      ELSE 'member'
    END,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'Marketing'),
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = now();
    -- NOTE: status is intentionally NOT updated here.
    -- This prevents resetting an already-active user back to 'pending' on re-login.

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
