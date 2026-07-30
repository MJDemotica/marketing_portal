-- ============================================================
-- Marketing Portal — Seed Request Templates
-- Run this in Supabase SQL Editor
-- ============================================================

INSERT INTO templates (name, fields) VALUES
  (
    'Social Media Graphic Request',
    '{"dimensions": "1080x1080", "platform": "Instagram, LinkedIn", "copy": "Text to include on graphic", "branding": "Standard Q3 palette"}'::jsonb
  ),
  (
    'Newsletter Design Update',
    '{"target_audience": "All Clients", "sections": "Header, Main Announcement, Feature Story, CTA", "delivery_date": "End of Month"}'::jsonb
  ),
  (
    'Event Promo Package',
    '{"event_name": "Annual Summit 2026", "deliverables": "Banner, Flyer, Email Header, Badge", "print_ready": true}'::jsonb
  ),
  (
    'Product Video Script',
    '{"duration": "60 seconds", "key_benefits": "Feature A, Feature B, Pricing", "call_to_action": "Visit website"}'::jsonb
  )
ON CONFLICT DO NOTHING;
