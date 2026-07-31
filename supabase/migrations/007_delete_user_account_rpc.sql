-- ============================================================
-- Marketing Portal — Delete User Account RPC Function
-- Run this in Supabase SQL Editor to allow Supervisors to delete accounts from auth.users
-- ============================================================

-- Create SECURITY DEFINER function to delete user from auth.users (cascades to profiles)
CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is a supervisor or deleting themselves
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'supervisor'
  ) OR auth.uid() = user_id THEN
    -- Delete from auth.users (automatically deletes profile via ON DELETE CASCADE)
    DELETE FROM auth.users WHERE id = user_id;
    -- Fallback delete from profiles
    DELETE FROM public.profiles WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only supervisors can delete user accounts.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
