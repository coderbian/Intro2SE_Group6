-- ===============================
-- EXTENSIONS
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================
-- USERS
-- ===============================
CREATE TABLE "users" (
  "id" varchar(128) PRIMARY KEY,
  "email" varchar(255) UNIQUE NOT NULL,
  "name" varchar(255) NOT NULL,
  "avatar_url" text,
  "phone" varchar(20),
  "role" varchar(20) NOT NULL DEFAULT 'user',
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "last_login_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE "user_preferences" (
  "user_id" varchar(128) PRIMARY KEY,
  "notifications" jsonb DEFAULT '{"email":true,"push":true}',
  "display" jsonb DEFAULT '{"theme":"light","view":"board"}',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ===============================
-- PROJECTS
-- ===============================
CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar(128),
  "name" varchar(255) NOT NULL,
  "description" text,
  "key" varchar(20) UNIQUE NOT NULL,
  "template" varchar(20) NOT NULL DEFAULT 'kanban',
  "visibility" varchar(20) NOT NULL DEFAULT 'private',
  "settings" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE "project_members" (
  "project_id" uuid,
  "user_id" varchar(128),
  "role" varchar(20) NOT NULL DEFAULT 'member',
  "joined_at" timestamp DEFAULT now(),
  PRIMARY KEY ("project_id", "user_id")
);

CREATE TABLE "join_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid,
  "user_id" varchar(128),
  "email" varchar(255),
  "invited_by" varchar(128),
  "request_type" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "token" varchar(255) UNIQUE,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- ===============================
-- BOARDS / SPRINTS / LISTS
-- ===============================
CREATE TABLE "boards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid,
  "name" varchar(200) NOT NULL,
  "position_index" int NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE "sprints" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid,
  "name" varchar(255) NOT NULL,
  "goal" text,
  "start_date" date,
  "end_date" date,
  "status" varchar(20) NOT NULL DEFAULT 'planned',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE "lists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "board_id" uuid,
  "name" varchar(255) NOT NULL,
  "category" varchar(20) NOT NULL,
  "position_index" int NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

-- ===============================
-- TASKS
-- ===============================
CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid,
  "board_id" uuid,
  "list_id" uuid,
  "sprint_id" uuid,
  "parent_id" uuid,
  "task_number" int NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "type" varchar(50) NOT NULL DEFAULT 'task',
  "status" varchar(20) NOT NULL DEFAULT 'todo',
  "priority" varchar(20) NOT NULL DEFAULT 'medium',
  "time_estimate" int,
  "time_spent" int DEFAULT 0,
  "story_points" int,
  "position_index" int DEFAULT 0,
  "due_date" date,
  "reporter_id" varchar(128),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE "task_assignees" (
  "task_id" uuid,
  "user_id" varchar(128),
  "assigned_by" varchar(128),
  "assigned_at" timestamp DEFAULT now(),
  PRIMARY KEY ("task_id", "user_id")
);

-- ===============================
-- LABELS
-- ===============================
CREATE TABLE "labels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid,
  "name" varchar(100) NOT NULL,
  "color" varchar(7) NOT NULL
);

CREATE TABLE "task_labels" (
  "task_id" uuid,
  "label_id" uuid,
  PRIMARY KEY ("task_id", "label_id")
);

-- ===============================
-- COMMENTS / ATTACHMENTS
-- ===============================
CREATE TABLE "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" uuid,
  "author_id" varchar(128),
  "parent_id" uuid,
  "content" text NOT NULL,
  "is_edited" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE "attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" uuid,
  "comment_id" uuid,
  "uploaded_by" varchar(128),
  "name" varchar(255) NOT NULL,
  "url" text NOT NULL,
  "type" varchar(50) NOT NULL,
  "file_size" bigint NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- ===============================
-- NOTIFICATIONS / ACTIVITY / AI
-- ===============================
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(128),
  "type" varchar(50),
  "title" varchar(255),
  "content" text,
  "entity_type" varchar(50),
  "entity_id" uuid,
  "is_read" boolean DEFAULT false,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE "activity_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid,
  "task_id" uuid,
  "user_id" varchar(128),
  "action" varchar(50),
  "entity_type" varchar(50),
  "entity_id" uuid,
  "old_value" jsonb,
  "new_value" jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE "ai_interactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(128),
  "project_id" uuid,
  "task_id" uuid,
  "feature" varchar(50),
  "request" jsonb,
  "response" jsonb,
  "status" varchar(20) DEFAULT 'suggested',
  "rating" int,
  "feedback" text,
  "provider" varchar(50),
  "model" varchar(50),
  "tokens" int,
  "cost_usd" decimal,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ===============================
-- UNIQUE + INDEX
-- ===============================
CREATE UNIQUE INDEX idx_tasks_project_number
ON tasks(project_id, task_number);

CREATE UNIQUE INDEX idx_labels_project_name
ON labels(project_id, name);

CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_boards_project ON boards(project_id);
CREATE INDEX idx_lists_board_position ON lists(board_id, position_index);
CREATE INDEX idx_tasks_board_position ON tasks(board_id, position_index);
CREATE INDEX idx_tasks_list_position ON tasks(list_id, position_index);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_tasks_reporter ON tasks(reporter_id);
CREATE INDEX idx_tasks_deleted ON tasks(deleted_at);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ===============================
-- FOREIGN KEYS
-- ===============================
ALTER TABLE user_preferences ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE projects ADD FOREIGN KEY (owner_id) REFERENCES users(id);
ALTER TABLE project_members ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE project_members ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE join_requests ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE join_requests ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE join_requests ADD FOREIGN KEY (invited_by) REFERENCES users(id);
ALTER TABLE boards ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE lists ADD FOREIGN KEY (board_id) REFERENCES boards(id);
ALTER TABLE sprints ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE tasks ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE tasks ADD FOREIGN KEY (board_id) REFERENCES boards(id);
ALTER TABLE tasks ADD FOREIGN KEY (list_id) REFERENCES lists(id);
ALTER TABLE tasks ADD FOREIGN KEY (sprint_id) REFERENCES sprints(id);
ALTER TABLE tasks ADD FOREIGN KEY (parent_id) REFERENCES tasks(id);
ALTER TABLE tasks ADD FOREIGN KEY (reporter_id) REFERENCES users(id);
ALTER TABLE task_assignees ADD FOREIGN KEY (task_id) REFERENCES tasks(id);
ALTER TABLE task_assignees ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE task_assignees ADD FOREIGN KEY (assigned_by) REFERENCES users(id);
ALTER TABLE labels ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE task_labels ADD FOREIGN KEY (task_id) REFERENCES tasks(id);
ALTER TABLE task_labels ADD FOREIGN KEY (label_id) REFERENCES labels(id);
ALTER TABLE comments ADD FOREIGN KEY (task_id) REFERENCES tasks(id);
ALTER TABLE comments ADD FOREIGN KEY (author_id) REFERENCES users(id);
ALTER TABLE comments ADD FOREIGN KEY (parent_id) REFERENCES comments(id);
ALTER TABLE attachments ADD FOREIGN KEY (task_id) REFERENCES tasks(id);
ALTER TABLE attachments ADD FOREIGN KEY (comment_id) REFERENCES comments(id);
ALTER TABLE attachments ADD FOREIGN KEY (uploaded_by) REFERENCES users(id);
ALTER TABLE notifications ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE activity_logs ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE activity_logs ADD FOREIGN KEY (task_id) REFERENCES tasks(id);
ALTER TABLE activity_logs ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ai_interactions ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ai_interactions ADD FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE ai_interactions ADD FOREIGN KEY (task_id) REFERENCES tasks(id);
