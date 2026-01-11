-- =====================================================
-- FIX: Add missing tables to realtime publication
-- =====================================================

-- Add projects and project_members to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;

-- Verify all 4 tables are now in publication
SELECT 
  tablename,
  '✅ Enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('notifications', 'join_requests', 'projects', 'project_members')
ORDER BY tablename;

-- Expected output:
-- join_requests    ✅ Enabled
-- notifications    ✅ Enabled
-- project_members  ✅ Enabled
-- projects         ✅ Enabled
