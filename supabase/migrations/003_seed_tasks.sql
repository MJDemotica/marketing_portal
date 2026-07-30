-- ============================================================
-- Marketing Portal — Seed Sample Tasks
-- Run this in Supabase SQL Editor AFTER users exist in profiles
-- ============================================================

-- This script creates sample tasks distributed across team members.
-- It references users by email from the profiles table.

DO $$
DECLARE
  v_sup_id UUID;
  v_mem1_id UUID;
  v_mem2_id UUID;
BEGIN
  -- Get user IDs (adjust emails to match your actual users)
  SELECT id INTO v_sup_id FROM profiles WHERE role = 'supervisor' LIMIT 1;
  SELECT id INTO v_mem1_id FROM profiles WHERE role = 'member' LIMIT 1;
  -- Use supervisor as fallback if only 2 users exist
  SELECT id INTO v_mem2_id FROM profiles WHERE role = 'member' AND id != v_mem1_id LIMIT 1;
  IF v_mem2_id IS NULL THEN v_mem2_id := v_sup_id; END IF;
  IF v_mem1_id IS NULL THEN v_mem1_id := v_sup_id; END IF;

  -- Clear existing sample tasks
  DELETE FROM tasks WHERE task_code LIKE 'MR-%';

  -- Insert sample tasks
  INSERT INTO tasks (task_code, title, description, priority, status, requestor_id, department, assignee_id, due_date, revision_count) VALUES
    ('MR-1001', 'Social Media Campaign Q3', 'Plan and execute Q3 social media campaign across all platforms', 'high', 'in_progress', v_sup_id, 'Marketing', v_mem1_id, CURRENT_DATE + INTERVAL '2 days', 0),
    ('MR-1002', 'Newsletter Design Update', 'Redesign the monthly newsletter template with new brand colors', 'normal', 'for_review', v_sup_id, 'Marketing', v_mem1_id, CURRENT_DATE + INTERVAL '5 days', 1),
    ('MR-1003', 'Brand Guidelines PDF', 'Create comprehensive brand guidelines document for distribution', 'high', 'in_progress', v_sup_id, 'Marketing', v_mem2_id, CURRENT_DATE - INTERVAL '2 days', 0),
    ('MR-1004', 'Event Promo Materials', 'Design promotional materials for annual company event', 'normal', 'assigned', v_sup_id, 'Marketing', v_mem1_id, CURRENT_DATE + INTERVAL '7 days', 0),
    ('MR-1005', 'Client Presentation Deck', 'Prepare Q3 results presentation for client meeting', 'urgent', 'for_review', v_sup_id, 'Marketing', v_mem2_id, CURRENT_DATE + INTERVAL '1 day', 2),
    ('MR-1006', 'Website Banner Refresh', 'Update homepage banners with new seasonal imagery', 'low', 'completed', v_sup_id, 'Marketing', v_mem1_id, CURRENT_DATE - INTERVAL '5 days', 1),
    ('MR-1007', 'Blog Content Calendar', 'Plan blog posts for next 3 months', 'normal', 'pending', v_sup_id, 'Marketing', NULL, CURRENT_DATE + INTERVAL '10 days', 0),
    ('MR-1008', 'Email Campaign Analysis', 'Analyze performance metrics of recent email campaigns', 'normal', 'assigned', v_sup_id, 'Marketing', v_mem2_id, CURRENT_DATE + INTERVAL '4 days', 0),
    ('MR-1009', 'Trade Show Booth Design', 'Design booth graphics for upcoming trade show', 'high', 'revision', v_sup_id, 'Marketing', v_mem1_id, CURRENT_DATE - INTERVAL '1 day', 3),
    ('MR-1010', 'Product Photography', 'Coordinate new product photography session', 'normal', 'in_progress', v_sup_id, 'Marketing', v_mem2_id, CURRENT_DATE + INTERVAL '6 days', 0),
    ('MR-1011', 'Annual Report Layout', 'Design and layout the annual company report', 'high', 'for_review', v_sup_id, 'Marketing', v_mem1_id, CURRENT_DATE + INTERVAL '3 days', 1),
    ('MR-1012', 'Social Media Analytics Report', 'Compile monthly social media performance report', 'low', 'completed', v_sup_id, 'Marketing', v_mem2_id, CURRENT_DATE - INTERVAL '3 days', 0),
    ('MR-1013', 'Video Promo Script', 'Write script for new product video promotion', 'normal', 'pending', v_sup_id, 'Marketing', NULL, CURRENT_DATE + INTERVAL '12 days', 0),
    ('MR-1014', 'Press Release Draft', 'Draft press release for new product launch', 'urgent', 'assigned', v_sup_id, 'Marketing', v_mem1_id, CURRENT_DATE + INTERVAL '2 days', 0),
    ('MR-1015', 'Partner Co-branding Assets', 'Create co-branded assets for partnership campaign', 'normal', 'for_review', v_sup_id, 'Marketing', v_mem2_id, CURRENT_DATE + INTERVAL '8 days', 1);

  RAISE NOTICE 'Seeded 15 sample tasks successfully!';
END $$;
