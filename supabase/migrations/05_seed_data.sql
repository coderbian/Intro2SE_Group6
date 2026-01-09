-- ============================================================================
-- SEED DATA - Sample Data for Development/Testing
-- ============================================================================
-- Run this AFTER completing all migrations
-- This creates sample users, projects, and tasks for testing
-- ============================================================================

-- ============================================================================
-- 1. CREATE SAMPLE USERS
-- ============================================================================
-- Note: Passwords are hashed using bcrypt
-- Default password for all users: "password123"

-- Admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'authenticated',
  'authenticated',
  'admin@planora.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"name": "Admin User", "role": "admin"}'::jsonb,
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Regular users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES 
(
  '00000000-0000-0000-0000-000000000000',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
  'authenticated',
  'authenticated',
  'john.doe@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"name": "John Doe"}'::jsonb,
  NOW(),
  NOW(),
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid,
  'authenticated',
  'authenticated',
  'jane.smith@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"name": "Jane Smith"}'::jsonb,
  NOW(),
  NOW(),
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid,
  'authenticated',
  'authenticated',
  'bob.wilson@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"name": "Bob Wilson"}'::jsonb,
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- The trigger will automatically create public.users records
-- But we can also manually insert if needed
INSERT INTO public.users (id, email, name, role, status) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'admin@planora.com', 'Admin User', 'admin', 'active'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'john.doe@example.com', 'John Doe', 'user', 'active'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, 'jane.smith@example.com', 'Jane Smith', 'user', 'active'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'bob.wilson@example.com', 'Bob Wilson', 'user', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE SAMPLE PROJECTS
-- ============================================================================

-- Project 1: E-commerce Platform (Kanban)
INSERT INTO public.projects (id, name, description, key, template, visibility, owner_id, deadline) VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'E-commerce Platform',
    'Building a modern e-commerce platform with React and Node.js',
    'ECOM',
    'kanban',
    'private',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, -- John Doe
    NOW() + INTERVAL '90 days'
  );

-- Project 2: Mobile Banking App (Scrum)
INSERT INTO public.projects (id, name, description, key, template, visibility, owner_id, deadline) VALUES
  (
    '20000000-0000-0000-0000-000000000002'::uuid,
    'Mobile Banking App',
    'Secure mobile banking application with biometric authentication',
    'BANK',
    'scrum',
    'private',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, -- Jane Smith
    NOW() + INTERVAL '120 days'
  );

-- Project 3: Task Management System (Scrum)
INSERT INTO public.projects (id, name, description, key, template, visibility, owner_id, deadline) VALUES
  (
    '30000000-0000-0000-0000-000000000003'::uuid,
    'Task Management System',
    'Internal task management and project tracking tool',
    'TMS',
    'scrum',
    'public',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, -- Admin
    NOW() + INTERVAL '60 days'
  );

-- ============================================================================
-- 3. ADD PROJECT MEMBERS
-- ============================================================================
-- Note: Owners are automatically added by trigger, so we add additional members

-- E-commerce Platform members
INSERT INTO public.project_members (project_id, user_id, role) VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, 'manager'), -- Jane
  ('10000000-0000-0000-0000-000000000001'::uuid, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'member')   -- Bob
ON CONFLICT DO NOTHING;

-- Mobile Banking App members
INSERT INTO public.project_members (project_id, user_id, role) VALUES
  ('20000000-0000-0000-0000-000000000002'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'manager'), -- John
  ('20000000-0000-0000-0000-000000000002'::uuid, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'member')   -- Bob
ON CONFLICT DO NOTHING;

-- Task Management System members (public project)
INSERT INTO public.project_members (project_id, user_id, role) VALUES
  ('30000000-0000-0000-0000-000000000003'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'manager'), -- John
  ('30000000-0000-0000-0000-000000000003'::uuid, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, 'member'),  -- Jane
  ('30000000-0000-0000-0000-000000000003'::uuid, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'member')   -- Bob
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. CREATE SPRINTS (for Scrum projects)
-- ============================================================================

-- Sprint 1 for Mobile Banking App
INSERT INTO public.sprints (id, project_id, name, goal, start_date, end_date, status) VALUES
  (
    '10000000-0000-0000-0000-000000000101'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    'Sprint 1: Foundation',
    'Setup project infrastructure and authentication',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day',
    'completed'
  ),
  (
    '20000000-0000-0000-0000-000000000102'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    'Sprint 2: Core Features',
    'Implement account management and transactions',
    NOW(),
    NOW() + INTERVAL '13 days',
    'active'
  );

-- Sprint for Task Management System
INSERT INTO public.sprints (id, project_id, name, goal, start_date, end_date, status) VALUES
  (
    '30000000-0000-0000-0000-000000000103'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    'Sprint 1: MVP',
    'Build minimum viable product',
    NOW(),
    NOW() + INTERVAL '14 days',
    'active'
  );

-- ============================================================================
-- 5. CREATE LABELS
-- ============================================================================

-- Labels for E-commerce Platform
INSERT INTO public.labels (project_id, name, color) VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, 'bug', '#f87171'),
  ('10000000-0000-0000-0000-000000000001'::uuid, 'feature', '#60a5fa'),
  ('10000000-0000-0000-0000-000000000001'::uuid, 'urgent', '#f59e0b'),
  ('10000000-0000-0000-0000-000000000001'::uuid, 'frontend', '#a78bfa'),
  ('10000000-0000-0000-0000-000000000001'::uuid, 'backend', '#34d399');

-- Labels for Mobile Banking App
INSERT INTO public.labels (project_id, name, color) VALUES
  ('20000000-0000-0000-0000-000000000002'::uuid, 'security', '#ef4444'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'performance', '#f59e0b'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'ui/ux', '#8b5cf6'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'testing', '#10b981');

-- ============================================================================
-- 6. CREATE TASKS
-- ============================================================================

-- Tasks for E-commerce Platform (Kanban)
INSERT INTO public.tasks (id, project_id, title, description, type, status, priority, story_points, created_by) VALUES
  (
    '10000000-0000-0000-0000-000000000201'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Setup Project Repository',
    'Initialize Git repository and configure CI/CD pipeline',
    'task',
    'done',
    'high',
    3,
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid
  ),
  (
    '10000000-0000-0000-0000-000000000202'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Design Product Catalog',
    'Create wireframes and mockups for product listing pages',
    'task',
    'in-progress',
    'high',
    5,
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid
  ),
  (
    '10000000-0000-0000-0000-000000000203'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Implement Shopping Cart',
    'Add/remove items, update quantities, calculate total',
    'user-story',
    'todo',
    'medium',
    8,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid
  ),
  (
    '10000000-0000-0000-0000-000000000204'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    'Payment Gateway Integration',
    'Integrate Stripe for secure payment processing',
    'task',
    'backlog',
    'high',
    13,
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid
  );

-- Tasks for Mobile Banking App (Scrum)
INSERT INTO public.tasks (id, project_id, sprint_id, title, description, type, status, priority, story_points, created_by, due_date) VALUES
  (
    '20000000-0000-0000-0000-000000000201'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    '10000000-0000-0000-0000-000000000101'::uuid,
    'User Authentication',
    'Implement login/signup with JWT',
    'user-story',
    'done',
    'urgent',
    8,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid,
    NOW() - INTERVAL '5 days'
  ),
  (
    '20000000-0000-0000-0000-000000000202'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000102'::uuid,
    'Account Balance Display',
    'Show real-time account balance',
    'task',
    'in-progress',
    'high',
    5,
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
    NOW() + INTERVAL '7 days'
  ),
  (
    '20000000-0000-0000-0000-000000000203'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000102'::uuid,
    'Transfer Money',
    'Implement money transfer between accounts',
    'user-story',
    'todo',
    'high',
    13,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid,
    NOW() + INTERVAL '10 days'
  );

-- ============================================================================
-- 7. ASSIGN TASKS
-- ============================================================================

INSERT INTO public.task_assignees (task_id, user_id) VALUES
  -- E-commerce tasks
  ('10000000-0000-0000-0000-000000000202'::uuid, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid), -- Design to Jane
  ('10000000-0000-0000-0000-000000000203'::uuid, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid), -- Cart to Bob
  
  -- Banking app tasks
  ('20000000-0000-0000-0000-000000000202'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid), -- Balance to John
  ('20000000-0000-0000-0000-000000000202'::uuid, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid), -- Balance to Bob (pair programming)
  ('20000000-0000-0000-0000-000000000203'::uuid, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid)  -- Transfer to Jane
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. CREATE COMMENTS
-- ============================================================================

INSERT INTO public.comments (task_id, user_id, content) VALUES
  (
    '10000000-0000-0000-0000-000000000202'::uuid,
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
    'Great progress on the design! The mockups look amazing.'
  ),
  (
    '20000000-0000-0000-0000-000000000202'::uuid,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid,
    'We need to add loading states for better UX'
  ),
  (
    '20000000-0000-0000-0000-000000000203'::uuid,
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid,
    'Should we implement transaction limits?'
  );

-- ============================================================================
-- 9. CREATE NOTIFICATIONS
-- ============================================================================

INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id, read) VALUES
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid,
    'task-assigned',
    'New Task Assignment',
    'You have been assigned to "Design Product Catalog"',
    'task',
    '10000000-0000-0000-0000-000000000202'::uuid,
    false
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
    'comment',
    'New Comment',
    'Jane Smith commented on "Account Balance Display"',
    'task',
    '20000000-0000-0000-0000-000000000202'::uuid,
    false
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid,
    'project-invite',
    'Project Invitation',
    'You have been added to "E-commerce Platform"',
    'project',
    '10000000-0000-0000-0000-000000000001'::uuid,
    true
  );

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
-- Sample data created:
-- ✅ 4 users (1 admin, 3 regular)
-- ✅ 3 projects (1 Kanban, 2 Scrum)
-- ✅ Project members assigned
-- ✅ 3 active sprints
-- ✅ 9 labels across projects
-- ✅ 7 tasks in various states
-- ✅ Task assignments
-- ✅ 3 comments
-- ✅ 3 notifications
--
-- Test credentials:
-- Email: admin@planora.com | Password: password123
-- Email: john.doe@example.com | Password: password123
-- Email: jane.smith@example.com | Password: password123
-- Email: bob.wilson@example.com | Password: password123
-- ============================================================================
