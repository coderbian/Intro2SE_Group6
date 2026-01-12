# 🎨 ARCHITECTURE DIAGRAM - PLANORA APP

## 📊 CURRENT STATE (HIỆN TẠI)

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│                    (React + Vite)                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Components  │  │   Contexts   │  │    Hooks     │ │
│  │              │  │              │  │              │ │
│  │  - Projects  │  │ - AppContext │  │- useProjects │ │
│  │  - Tasks     │──│ - AuthContext│──│- useTasks    │ │
│  │  - Dashboard │  │              │  │- useSprints  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│                    Auth ✅                              │
│                     ↓                                   │
│                 Supabase                                │
│                                                         │
│                    Data ❌                              │
│                     ↓                                   │
│              localStorage                               │
│         (mất khi clear browser)                         │
└─────────────────────────────────────────────────────────┘

❌ VẤN ĐỀ:
- Data chỉ lưu trong browser (localStorage)
- Không sync giữa devices
- Không có backend API
- Mất data khi clear cache
```

---

## 🎯 TARGET STATE (MỤC TIÊU - SAU KHI INTEGRATION)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                   │
│                       (React + Vite)                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Components  │  │   Contexts   │  │    Hooks (NEW! ✅)       │ │
│  │              │  │              │  │                          │ │
│  │  - Projects  │  │ - AppContext │  │ - useProjectsAPI        │ │
│  │  - Tasks     │──│ - AuthContext│──│ - useTasksAPI           │ │
│  │  - Dashboard │  │              │  │ - useSprintsAPI         │ │
│  │  - Kanban    │  │              │  │ - useNotificationsAPI   │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                     │
│                    Auth ✅           API Calls ✅                   │
│                     ↓                      ↓                        │
│                 ┌─────────────────────────────────┐                │
│                 │  API Client (NEW! ✅)          │                │
│                 │  - projectsApi                  │                │
│                 │  - tasksApi                     │                │
│                 │  - sprintsApi                   │                │
│                 │  - notificationsApi             │                │
│                 └─────────────────────────────────┘                │
│                              ↓                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               │ HTTP/HTTPS
                               │ (JWT Token)
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND API                                │
│                     (Express.js + TypeScript)                       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Middleware  │  │   Modules    │  │      Services            │ │
│  │              │  │              │  │                          │ │
│  │ - Auth       │  │ - Projects   │  │ - project.service.ts    │ │
│  │ - Validation │──│ - Tasks      │──│ - task.service.ts       │ │
│  │ - Rate Limit │  │ - Sprints    │  │ - sprint.service.ts     │ │
│  │ - Error      │  │ - Notifs     │  │ - notification.service  │ │
│  └──────────────┘  │ - Comments   │  └──────────────────────────┘ │
│                    │ - Attachments│                                │
│                    │ - Labels     │                                │
│                    │ - AI         │                                │
│                    │ - Admin      │                                │
│                    └──────────────┘                                │
│                           ↓                                         │
│                   Database Queries                                  │
│                           ↓                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ PostgreSQL
                            │ (RLS Security)
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                       │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │  PostgreSQL Database │  │   Storage Buckets    │               │
│  │                      │  │                      │               │
│  │  17 Tables:          │  │  - avatars (public)  │               │
│  │  - users             │  │  - attachments       │               │
│  │  - projects          │  │    (private)         │               │
│  │  - tasks             │  │                      │               │
│  │  - sprints           │  └──────────────────────┘               │
│  │  - comments          │                                          │
│  │  - attachments       │  ┌──────────────────────┐               │
│  │  - notifications     │  │   Auth System        │               │
│  │  - activity_logs     │  │                      │               │
│  │  - labels            │  │  - JWT Tokens        │               │
│  │  - ... (+ 8 more)    │  │  - Session Mgmt      │               │
│  │                      │  │  - Password Reset    │               │
│  │  + RLS Policies      │  └──────────────────────┘               │
│  │  + Triggers          │                                          │
│  │  + Functions         │                                          │
│  └──────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│               SOCKET.IO REAL-TIME (Optional)                        │
│                                                                     │
│  Frontend Socket Client ←──WebSocket──→ Backend Socket Server      │
│                                                                     │
│  Events:                                                            │
│  - task:created, task:updated, task:deleted                         │
│  - project:updated                                                  │
│  - notification (real-time)                                         │
│  - member:joined, member:left                                       │
└─────────────────────────────────────────────────────────────────────┘

✅ GIẢI PHÁP:
- Data persistent trong PostgreSQL
- Sync giữa tất cả devices/users
- Full authentication & authorization
- Real-time updates (Socket.IO)
- File uploads (Supabase Storage)
- Activity tracking & logging
```

---

## 🔄 REQUEST FLOW

### 1. User Login
```
User enters credentials
    ↓
Frontend → Supabase Auth.signIn()
    ↓
Supabase validates credentials
    ↓
Returns JWT token + user data
    ↓
Frontend stores session
    ↓
Backend receives requests with JWT in headers
    ↓
Backend validates JWT with Supabase
    ↓
Request authorized ✅
```

### 2. Create Project
```
User clicks "Create Project"
    ↓
Frontend: handleCreateProject(data)
    ↓
API Client: projectsApi.create(data)
    ↓
HTTP POST /api/projects
Headers: { Authorization: "Bearer <JWT>" }
Body: { name, description, template, ... }
    ↓
Backend: authMiddleware validates JWT
    ↓
Backend: validationMiddleware checks data
    ↓
Backend: project.service.createProject()
    ↓
Database: INSERT INTO projects (...)
    ↓
Database: INSERT INTO project_members (owner)
    ↓
Trigger: create_activity_log (auto)
    ↓
Backend: Returns created project
    ↓
Frontend: Updates state + shows success toast
    ↓
Socket.IO: Broadcasts "project:created" (real-time)
    ↓
Other users see new project instantly ✅
```

### 3. Create Task
```
User creates task in project
    ↓
Frontend: handleCreateTask(taskData)
    ↓
API Client: tasksApi.create(projectId, taskData)
    ↓
HTTP POST /api/projects/{id}/tasks
    ↓
Backend: Validates user is project member
    ↓
Backend: task.service.createTask()
    ↓
Database: INSERT INTO tasks (...)
    ↓
Database: INSERT INTO task_assignees (if assignees)
    ↓
Trigger: create_notification for assignees
    ↓
Trigger: create_activity_log
    ↓
Backend: Returns created task
    ↓
Frontend: Updates tasks list
    ↓
Socket.IO: "task:created" → Real-time update
    ↓
Assignees receive notification ✅
```

### 4. Upload Attachment
```
User uploads file to task
    ↓
Frontend: handleUploadAttachment(taskId, file)
    ↓
API Client: attachmentsApi.upload(projectId, taskId, file)
    ↓
HTTP POST /api/projects/{id}/tasks/{id}/attachments
Content-Type: multipart/form-data
    ↓
Backend: Validates file type & size
    ↓
Backend: Uploads to Supabase Storage
    ↓
Supabase Storage: Returns file URL
    ↓
Backend: INSERT INTO attachments (task_id, url, ...)
    ↓
Backend: Returns attachment data
    ↓
Frontend: Shows attachment in task
    ↓
Other users can download file ✅
```

---

## 🗂️ DATABASE SCHEMA (17 Tables)

```
┌─────────────┐
│   users     │ (Auth + Profile)
│ ----------- │
│ id          │ ←──┐
│ email       │    │
│ name        │    │
│ role        │    │ Foreign Keys
│ avatar      │    │
└─────────────┘    │
                   │
┌─────────────────┐│     ┌──────────────────┐
│   projects      ││     │ project_members  │
│ --------------- ││     │ ---------------- │
│ id              ││     │ project_id   ────┼──→ projects.id
│ name            ││     │ user_id      ────┼──→ users.id
│ description     ││     │ role             │
│ owner_id     ───┼┘     │ joined_at        │
│ template        │      └──────────────────┘
│ deadline        │
│ created_at      │
│ deleted_at      │
└─────────────────┘
         │
         └───────┐
                 │
┌────────────────┴┐     ┌──────────────────┐
│   tasks         │     │  task_assignees  │
│ --------------- │     │ ---------------- │
│ id              │     │ task_id      ────┼──→ tasks.id
│ project_id   ───┼─→   │ user_id      ────┼──→ users.id
│ parent_task_id  │     │ assigned_at      │
│ sprint_id       │     └──────────────────┘
│ type            │
│ title           │     ┌──────────────────┐
│ description     │     │   comments       │
│ status          │     │ ---------------- │
│ priority        │     │ id               │
│ story_points    │     │ task_id      ────┼──→ tasks.id
│ deadline        │     │ user_id      ────┼──→ users.id
│ created_by   ───┼─→   │ content          │
│ created_at      │     │ created_at       │
│ deleted_at      │     └──────────────────┘
└─────────────────┘
         │              ┌──────────────────┐
         └──────────────┤  attachments     │
                        │ ---------------- │
                        │ id               │
                        │ task_id      ────┼──→ tasks.id
                        │ name             │
                        │ url              │
                        │ type             │
                        │ size             │
                        │ uploaded_by  ────┼──→ users.id
                        └──────────────────┘

┌─────────────────┐
│   sprints       │
│ --------------- │
│ id              │
│ project_id   ───┼──→ projects.id
│ name            │
│ goal            │
│ start_date      │
│ end_date        │
│ status          │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│   labels        │     │  task_labels     │
│ --------------- │     │ ---------------- │
│ id              │     │ task_id      ────┼──→ tasks.id
│ project_id   ───┼─→   │ label_id     ────┼──→ labels.id
│ name            │     └──────────────────┘
│ color           │
└─────────────────┘

┌─────────────────┐
│ notifications   │
│ --------------- │
│ id              │
│ user_id      ───┼──→ users.id
│ type            │
│ title           │
│ message         │
│ read            │
│ related_id      │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│ activity_logs   │
│ --------------- │
│ id              │
│ user_id      ───┼──→ users.id
│ project_id   ───┼──→ projects.id
│ action          │
│ entity_type     │
│ entity_id       │
│ details         │
│ created_at      │
└─────────────────┘

... + boards, lists, invitations, join_requests, task_proposals
```

---

## 🔐 SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 1: Frontend                          │
│  - Supabase Auth (JWT token)                                    │
│  - Token stored in session                                      │
│  - Auto-refresh token                                           │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Layer 2: Backend API                          │
│  - Auth Middleware (validates JWT)                              │
│  - Validation Middleware (Zod schemas)                          │
│  - Rate Limiting (100 requests / 15 min)                        │
│  - Error handling                                               │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                Layer 3: Database (RLS)                          │
│  - Row Level Security policies                                  │
│  - Users can only see their projects                            │
│  - Users can only modify if they're project members             │
│  - Users can only see notifications for themselves             │
└─────────────────────────────────────────────────────────────────┘

Example RLS Policy:
```sql
-- Users can only see projects they're members of
CREATE POLICY "Users can view their projects"
ON projects FOR SELECT
USING (
  id IN (
    SELECT project_id 
    FROM project_members 
    WHERE user_id = auth.uid()
  )
);
```
```

---

## 🚦 DATA FLOW COMPARISON

### OLD (localStorage) ❌
```
User Action → Frontend State → localStorage
                                    ↓
                            (Lost on clear browser)
```

### NEW (Backend API) ✅
```
User Action 
    ↓
Frontend State (optimistic update)
    ↓
API Call → Backend → Database (persistent)
    ↓                    ↓
Success Response    Socket.IO broadcast
    ↓                    ↓
Update State      Other users updated
```

---

## 📡 REAL-TIME EVENTS (Socket.IO)

```
┌────────────────────────────────────────────────────────────┐
│                    Socket.IO Events                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Server → Client Events:                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ project:created       → New project added            │ │
│  │ project:updated       → Project details changed      │ │
│  │ project:deleted       → Project removed              │ │
│  │                                                      │ │
│  │ task:created          → New task added               │ │
│  │ task:updated          → Task status/assignee changed │ │
│  │ task:deleted          → Task removed                 │ │
│  │ task:moved            → Task moved to another list   │ │
│  │                                                      │ │
│  │ comment:added         → New comment on task          │ │
│  │ attachment:uploaded   → New file uploaded            │ │
│  │                                                      │ │
│  │ sprint:started        → Sprint has started           │ │
│  │ sprint:completed      → Sprint completed             │ │
│  │                                                      │ │
│  │ member:joined         → New member joined project    │ │
│  │ member:left           → Member left project          │ │
│  │                                                      │ │
│  │ notification          → Real-time notification       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Client → Server Events:                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ join:project          → Join project room            │ │
│  │ leave:project         → Leave project room           │ │
│  │ typing:start          → User is typing comment       │ │
│  │ typing:stop           → User stopped typing          │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 INTEGRATION STEPS VISUAL

```
Step 1: Deploy Database          Step 2: Start Backend
┌──────────────────┐             ┌──────────────────┐
│   Supabase       │             │   Express.js     │
│   Dashboard      │             │   Server         │
│                  │             │                  │
│  SQL Editor      │             │  Port 3001       │
│   ↓ Run         │             │   ↓ Running      │
│  01_tables.sql   │             │  Listening...    │
│  02_rls.sql      │             │                  │
│  03_storage.sql  │             │  60+ Endpoints   │
│  04_triggers.sql │             │  ✅ Ready        │
│  05_seed.sql     │             │                  │
│  ✅ 17 tables    │             └──────────────────┘
└──────────────────┘                      ↑
        ↓                                 │
        └─────────────────────────────────┘
                      │
              Step 3: Connect
                      ↓
         ┌────────────────────────┐
         │   Frontend             │
         │   (React + Vite)       │
         │                        │
         │   Update imports:      │
         │   - useProjectsAPI     │
         │   - useTasksAPI        │
         │   - useSprintsAPI      │
         │                        │
         │   API Client:          │
         │   projectsApi.create() │
         │         ↓              │
         │   POST /api/projects   │
         │         ↓              │
         │   Backend → Database   │
         │   ✅ Working!          │
         └────────────────────────┘
```

---

## 📈 BEFORE vs AFTER

### BEFORE (localStorage)
```
Features:
❌ No data persistence (clear browser = lost data)
❌ No collaboration (each user has own data)
❌ No real-time updates
❌ No security (anyone can edit localStorage)
❌ No file uploads
❌ No activity tracking
❌ Limited to one browser/device

Data Flow:
User → Frontend State → localStorage
```

### AFTER (Backend API + Database)
```
Features:
✅ Full data persistence (database)
✅ Real-time collaboration (Socket.IO)
✅ Live updates (instant sync)
✅ JWT authentication + RLS security
✅ File uploads (Supabase Storage)
✅ Activity logging (audit trail)
✅ Access from any device

Data Flow:
User → Frontend → API Client → Backend API → PostgreSQL
                                    ↓
                              Socket.IO (broadcast)
                                    ↓
                            All connected users
```

---

## 🎉 FINAL RESULT

Một **Production-ready Project Management App** với:

✅ **Authentication & Authorization**
✅ **Real-time Collaboration**
✅ **Data Persistence**
✅ **File Management**
✅ **Activity Tracking**
✅ **Notifications**
✅ **Kanban & Scrum Views**
✅ **Sprint Management**
✅ **Member Management**
✅ **Security (JWT + RLS)**

---

**Bắt đầu integration ngay tại:** [START_HERE.md](START_HERE.md)
