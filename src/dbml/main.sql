-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  task_id uuid,
  user_id uuid,
  action character varying,
  entity_type character varying,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT activity_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ai_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  project_id uuid,
  task_id uuid,
  feature character varying,
  request jsonb,
  response jsonb,
  status character varying DEFAULT 'suggested'::character varying,
  rating integer,
  feedback text,
  provider character varying,
  model character varying,
  tokens integer,
  cost_usd numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_interactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_interactions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id)
);
CREATE TABLE public.attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid,
  comment_id uuid,
  uploaded_by uuid,
  name character varying NOT NULL,
  url text NOT NULL,
  type character varying NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attachments_pkey PRIMARY KEY (id),
  CONSTRAINT attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT attachments_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id),
  CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.boards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  name character varying NOT NULL,
  position_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT boards_pkey PRIMARY KEY (id),
  CONSTRAINT boards_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid,
  author_id uuid,
  parent_id uuid,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id)
);
CREATE TABLE public.join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  email character varying,
  invited_by uuid,
  request_type character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  token character varying UNIQUE,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT join_requests_pkey PRIMARY KEY (id),
  CONSTRAINT join_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT join_requests_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)
);
CREATE TABLE public.labels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  name character varying NOT NULL,
  color character varying NOT NULL,
  CONSTRAINT labels_pkey PRIMARY KEY (id),
  CONSTRAINT labels_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  board_id uuid,
  name character varying NOT NULL,
  category character varying NOT NULL,
  position_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lists_pkey PRIMARY KEY (id),
  CONSTRAINT lists_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type character varying,
  title character varying,
  content text,
  entity_type character varying,
  entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_members (
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying NOT NULL DEFAULT 'member'::character varying,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  name character varying NOT NULL,
  description text,
  key character varying NOT NULL,
  template character varying NOT NULL DEFAULT 'kanban'::character varying,
  visibility character varying NOT NULL DEFAULT 'private'::character varying,
  settings jsonb,
  deadline date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.sprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  name character varying NOT NULL,
  goal text,
  start_date date,
  end_date date,
  status character varying NOT NULL DEFAULT 'planned'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sprints_pkey PRIMARY KEY (id),
  CONSTRAINT sprints_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.task_assignees (
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT task_assignees_pkey PRIMARY KEY (task_id, user_id),
  CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT task_assignees_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.task_labels (
  task_id uuid NOT NULL,
  label_id uuid NOT NULL,
  CONSTRAINT task_labels_pkey PRIMARY KEY (task_id, label_id),
  CONSTRAINT task_labels_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_labels_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.labels(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  board_id uuid,
  list_id uuid,
  sprint_id uuid,
  parent_id uuid,
  task_number integer NOT NULL,
  title character varying NOT NULL,
  description text,
  type character varying NOT NULL DEFAULT 'task'::character varying,
  status character varying NOT NULL DEFAULT 'todo'::character varying CHECK (status::text = ANY (ARRAY['backlog'::character varying, 'todo'::character varying, 'in-progress'::character varying, 'done'::character varying]::text[])),
  priority character varying NOT NULL DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  time_estimate integer,
  time_spent integer DEFAULT 0,
  story_points integer,
  position_index integer DEFAULT 0,
  due_date date,
  reporter_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT tasks_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id),
  CONSTRAINT tasks_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id),
  CONSTRAINT tasks_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.sprints(id),
  CONSTRAINT tasks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.tasks(id),
  CONSTRAINT tasks_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_preferences (
  user_id uuid NOT NULL,
  notifications jsonb DEFAULT '{"push": true, "email": true}'::jsonb,
  display jsonb DEFAULT '{"view": "board", "theme": "light"}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  avatar_url text,
  phone character varying,
  role character varying NOT NULL DEFAULT 'user'::character varying CHECK (role::text = ANY (ARRAY['user'::character varying::text, 'admin'::character varying::text])),
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
  last_login_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);