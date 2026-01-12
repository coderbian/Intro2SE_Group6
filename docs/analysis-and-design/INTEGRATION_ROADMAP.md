# 🚀 LỘ TRÌNH HOÀN THIỆN APP - CHI TIẾT TỪNG BƯỚC

## 📋 TỔNG QUAN

App hiện tại:
- ✅ Backend đã hoàn thiện (Express.js + 14 modules + 60+ API endpoints)
- ✅ Frontend UI đã xong (React + Components)
- ✅ Supabase Auth đã tích hợp
- ⚠️ **VẤN ĐỀ**: Frontend đang dùng localStorage, chưa gọi Backend API
- ⚠️ **VẤN ĐỀ**: Database schema chưa deploy lên Supabase

**MỤC TIÊU**: Kết nối Frontend ↔ Backend ↔ Database để app hoạt động hoàn chỉnh

---

## 📝 CHECKLIST TIẾN ĐỘ

### BƯỚC 1: Setup Database ⏱️ 15-20 phút
- [ ] 1.1. Đăng nhập Supabase Dashboard
- [ ] 1.2. Chạy migration 01_create_tables.sql
- [ ] 1.3. Chạy migration 02_enable_rls.sql
- [ ] 1.4. Chạy migration 03_create_storage_buckets.sql
- [ ] 1.5. Chạy migration 04_create_triggers.sql
- [ ] 1.6. (Optional) Chạy migration 05_seed_data.sql
- [ ] 1.7. Verify tables đã tạo

### BƯỚC 2: Setup Backend Server ⏱️ 10-15 phút
- [ ] 2.1. Tạo file `.env` trong `src/backend/`
- [ ] 2.2. Điền các biến môi trường (Supabase keys, JWT secret, etc.)
- [ ] 2.3. Chạy `npm install` trong `src/backend/`
- [ ] 2.4. Chạy `npm run dev` để start backend
- [ ] 2.5. Test API với `curl http://localhost:3001/health`

### BƯỚC 3: Tạo API Client ⏱️ 5 phút
- [x] 3.1. File `src/services/apiClient.ts` đã được tạo sẵn ✅
- [ ] 3.2. Thêm `VITE_API_URL` vào file `src/.env`
- [ ] 3.3. Restart frontend dev server

### BƯỚC 4: Thay thế Hooks ⏱️ 20-30 phút
- [x] 4.1. Tạo `useProjectsAPI.ts` - ✅ Đã tạo
- [x] 4.2. Tạo `useTasksAPI.ts` - ✅ Đã tạo
- [x] 4.3. Tạo `useSprintsAPI.ts` - ✅ Đã tạo
- [x] 4.4. Tạo `useNotificationsAPI.ts` - ✅ Đã tạo
- [ ] 4.5. Update `AppContext.tsx` để dùng hooks mới
- [ ] 4.6. Test từng tính năng

### BƯỚC 5: Socket.IO Real-time ⏱️ 30 phút
- [ ] 5.1. Install `socket.io-client`
- [ ] 5.2. Tạo `src/lib/socketClient.ts`
- [ ] 5.3. Tích hợp vào các components cần real-time
- [ ] 5.4. Test real-time updates

### BƯỚC 6: Testing & Debug ⏱️ 1-2 giờ
- [ ] 6.1. Test đăng ký/đăng nhập
- [ ] 6.2. Test tạo/sửa/xóa project
- [ ] 6.3. Test tạo/sửa/xóa task
- [ ] 6.4. Test invite members
- [ ] 6.5. Test comments & attachments
- [ ] 6.6. Test notifications
- [ ] 6.7. Test sprint management
- [ ] 6.8. Fix bugs nếu có

### BƯỚC 7: Deployment (Optional) ⏱️ 1-2 giờ
- [ ] 7.1. Deploy backend lên Railway/Render/Heroku
- [ ] 7.2. Deploy frontend lên Vercel/Netlify
- [ ] 7.3. Update environment variables
- [ ] 7.4. Test production

---

## 🔧 BƯỚC 1: SETUP DATABASE

### 1.1. Truy cập Supabase Dashboard

1. Mở trình duyệt, vào https://app.supabase.com
2. Đăng nhập vào account của bạn
3. Chọn project đang dùng (hoặc tạo project mới nếu chưa có)

### 1.2. Chạy Migration Files

1. Trong Dashboard, vào **SQL Editor** (icon database bên trái)
2. Click **New Query**
3. Copy nội dung từ file `src/backend/database/migrations/01_create_tables.sql`
4. Paste vào editor và click **Run**
5. Đợi cho đến khi thấy ✅ Success

**Lặp lại bước 2-5 cho các file:**
- `02_enable_rls.sql`
- `03_create_storage_buckets.sql`
- `04_create_triggers.sql`
- `05_seed_data.sql` (optional - data mẫu để test)

### 1.3. Verify Database

Chạy query này để kiểm tra tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected output:** Phải có 17 tables:
- users
- projects
- project_members
- tasks
- task_assignees
- sprints
- boards
- lists
- labels
- task_labels
- comments
- attachments
- notifications
- activity_logs
- invitations
- join_requests
- task_proposals

### 1.4. Kiểm tra Storage Buckets

1. Vào **Storage** trong sidebar
2. Phải thấy 2 buckets:
   - `avatars` (public)
   - `attachments` (private)

---

## 🖥️ BƯỚC 2: SETUP BACKEND SERVER

### 2.1. Tạo file `.env` cho Backend

Tạo file mới: `src/backend/.env`

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Supabase Configuration
# Lấy từ: https://app.supabase.com/project/_/settings/api
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration (tạo secret key ngẫu nhiên >= 32 ký tự)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration (URL của frontend)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined

# OpenAI (optional - cho AI features)
OPENAI_API_KEY=your-openai-key-if-you-have
```

**⚠️ QUAN TRỌNG:**
- `SUPABASE_URL`: Copy từ Project Settings → API → Project URL
- `SUPABASE_ANON_KEY`: Copy từ Project Settings → API → Project API keys → anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Copy từ Project Settings → API → Project API keys → service_role (⚠️ giữ bí mật!)
- `JWT_SECRET`: Tạo random string dài >= 32 ký tự (có thể dùng: https://randomkeygen.com/)

### 2.2. Install Dependencies

Mở terminal, chạy:

```bash
cd src/backend
npm install
```

### 2.3. Start Backend Server

```bash
npm run dev
```

**Expected output:**

```
[INFO] Server started on port 3001
[INFO] Environment: development
[INFO] Socket.IO initialized
```

### 2.4. Test Backend API

Mở terminal mới (giữ backend đang chạy), test:

```bash
# Test health check
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-...","version":"1.0.0"}
```

Nếu thấy response này → Backend đã chạy thành công! ✅

---

## 🌐 BƯỚC 3: SETUP API CLIENT CHO FRONTEND

### 3.1. File `apiClient.ts` đã được tạo sẵn ✅

File `src/services/apiClient.ts` đã được tạo với:
- Base API client với authentication
- Functions cho tất cả API endpoints:
  - `projectsApi` - CRUD projects, members
  - `tasksApi` - CRUD tasks, assignees
  - `sprintsApi` - Sprint management
  - `commentsApi` - Task comments
  - `attachmentsApi` - File uploads
  - `labelsApi` - Labels management
  - `notificationsApi` - Notifications
  - `usersApi` - User profile
  - `aiApi` - AI features

### 3.2. Thêm Environment Variable

Tạo/Update file `src/.env`:

```env
# Supabase (đã có)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL (THÊM MỚI)
VITE_API_URL=http://localhost:3001/api
```

### 3.3. Restart Frontend

```bash
# Stop frontend (Ctrl+C)
# Start lại
npm run dev
```

---

## 🔄 BƯỚC 4: THAY THẾ HOOKS

### 4.1. Các Hooks API mới đã được tạo ✅

Đã tạo sẵn 4 hooks mới gọi Backend API:
- `src/hooks/useProjectsAPI.ts`
- `src/hooks/useTasksAPI.ts`
- `src/hooks/useSprintsAPI.ts`
- `src/hooks/useNotificationsAPI.ts`

### 4.2. Update `AppContext.tsx`

**Hiện tại:** `AppContext.tsx` đang import hooks cũ (localStorage)

```typescript
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useSprints } from '../hooks/useSprints';
import { useNotifications } from '../hooks/useNotifications';
```

**Thay đổi thành:**

```typescript
import { useProjects } from '../hooks/useProjectsAPI';
import { useTasks } from '../hooks/useTasksAPI';
import { useSprints } from '../hooks/useSprintsAPI';
import { useNotifications } from '../hooks/useNotificationsAPI';
```

**File cần sửa:** `src/contexts/AppContext.tsx`

#### Cách sửa chi tiết:

1. Mở file `src/contexts/AppContext.tsx`
2. Tìm dòng imports (khoảng dòng 3-6)
3. Thay đổi:

```typescript
// CŨ (XÓA)
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useSprints } from '../hooks/useSprints';
import { useNotifications } from '../hooks/useNotifications';

// MỚI (THÊM)
import { useProjects } from '../hooks/useProjectsAPI';
import { useTasks } from '../hooks/useTasksAPI';
import { useSprints } from '../hooks/useSprintsAPI';
import { useNotifications } from '../hooks/useNotificationsAPI';
```

4. Save file

### 4.3. Load Data khi chọn Project

Thêm effect để load tasks/sprints khi user chọn project:

Trong `AppContext.tsx`, thêm đoạn này sau khi define hooks:

```typescript
// Load tasks and sprints when project is selected
useEffect(() => {
  if (selectedProjectId) {
    fetchTasksForProject(selectedProjectId);
    fetchSprintsForProject(selectedProjectId);
  }
}, [selectedProjectId, fetchTasksForProject, fetchSprintsForProject]);
```

### 4.4. Test từng tính năng

**Test 1: Projects**
1. Mở app, đăng nhập
2. Tạo project mới
3. Mở Developer Tools (F12) → Network tab
4. Phải thấy API call: `POST http://localhost:3001/api/projects`
5. Refresh trang → Projects phải còn (không mất như localStorage)

**Test 2: Tasks**
1. Vào một project
2. Tạo task mới
3. Kiểm tra Network tab: `POST http://localhost:3001/api/projects/{id}/tasks`
4. Task phải xuất hiện ngay

**Test 3: Members**
1. Vào Project Settings
2. Thêm member mới (nhập email)
3. Kiểm tra Network tab: `POST http://localhost:3001/api/projects/{id}/members`

Nếu tất cả API calls xuất hiện trong Network tab → Integration thành công! ✅

---

## 🔌 BƯỚC 5: SOCKET.IO REAL-TIME (Optional nhưng recommended)

### 5.1. Install Socket.IO Client

```bash
cd src
npm install socket.io-client
```

### 5.2. Tạo Socket Client

Tạo file mới: `src/lib/socketClient.ts`

```typescript
import { io, Socket } from 'socket.io-client';
import { getSupabaseClient } from './supabase-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

let socket: Socket | null = null;

export async function initializeSocket() {
  if (socket?.connected) {
    return socket;
  }

  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.warn('No session found, cannot initialize socket');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: session.access_token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Event listeners
export function onProjectUpdate(callback: (data: any) => void) {
  socket?.on('project:updated', callback);
}

export function onTaskUpdate(callback: (data: any) => void) {
  socket?.on('task:updated', callback);
}

export function onTaskCreated(callback: (data: any) => void) {
  socket?.on('task:created', callback);
}

export function onNotification(callback: (data: any) => void) {
  socket?.on('notification', callback);
}

export function offProjectUpdate(callback: (data: any) => void) {
  socket?.off('project:updated', callback);
}

export function offTaskUpdate(callback: (data: any) => void) {
  socket?.off('task:updated', callback);
}

export function offTaskCreated(callback: (data: any) => void) {
  socket?.off('task:created', callback);
}

export function offNotification(callback: (data: any) => void) {
  socket?.off('notification', callback);
}
```

### 5.3. Tích hợp Socket vào AppContext

Trong `src/contexts/AppContext.tsx`, thêm:

```typescript
import { initializeSocket, disconnectSocket, onTaskUpdate, onNotification } from '../lib/socketClient';

// Trong component AppProvider
useEffect(() => {
  if (user) {
    // Initialize socket when user logs in
    initializeSocket();

    // Cleanup on logout
    return () => {
      disconnectSocket();
    };
  }
}, [user]);

// Listen for real-time updates
useEffect(() => {
  if (!user) return;

  const handleTaskUpdate = (data: any) => {
    // Update tasks in real-time
    setTasks(prev => prev.map(t => 
      t.id === data.taskId ? { ...t, ...data.updates } : t
    ));
  };

  const handleNotification = (data: any) => {
    handleAddNotification(data);
  };

  onTaskUpdate(handleTaskUpdate);
  onNotification(handleNotification);

  return () => {
    offTaskUpdate(handleTaskUpdate);
    offNotification(handleNotification);
  };
}, [user]);
```

### 5.4. Test Real-time

1. Mở 2 tabs browser với 2 accounts khác nhau
2. Cùng vào 1 project
3. User 1 tạo task mới
4. User 2 phải thấy task xuất hiện ngay lập tức (không cần refresh)

---

## 🐛 BƯỚC 6: TESTING & DEBUG

### 6.1. Test Flow hoàn chỉnh

**Scenario 1: Tạo Project & Tasks**
1. Đăng ký account mới
2. Tạo project "Test Project"
3. Chọn template Kanban
4. Tạo 3 tasks: "Todo", "In Progress", "Done"
5. Di chuyển tasks giữa các columns
6. Thêm labels, deadlines
7. Upload attachments

**Scenario 2: Collaboration**
1. User A tạo project
2. User A invite User B (nhập email)
3. User B accept invitation
4. User A assign task cho User B
5. User B nhận notification
6. User B comment vào task
7. User A nhận notification

**Scenario 3: Sprint Management**
1. Tạo project với template Scrum
2. Tạo User Stories
3. Tạo Tasks con cho User Stories
4. Tạo Sprint mới
5. Add tasks vào Sprint
6. Start Sprint
7. Move tasks: Backlog → In Progress → Done
8. Complete Sprint

### 6.2. Common Issues & Solutions

**Issue 1: CORS Error**
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```
**Solution:** Kiểm tra `CORS_ORIGIN` trong `src/backend/.env` có chứa `http://localhost:5173`

**Issue 2: Unauthorized 401**
```
POST http://localhost:3001/api/projects 401 (Unauthorized)
```
**Solution:** 
- Kiểm tra user đã login chưa
- Kiểm tra Supabase Auth token đang được gửi trong headers
- Check `apiClient.ts` → `getAuthHeaders()` function

**Issue 3: Database Error**
```
relation "users" does not exist
```
**Solution:** Database migrations chưa chạy. Quay lại BƯỚC 1 và chạy lại migrations.

**Issue 4: Backend không start**
```
Error: Environment variable "SUPABASE_URL" is required
```
**Solution:** File `.env` chưa có hoặc sai đường dẫn. Đảm bảo file ở `src/backend/.env`

### 6.3. Debug Tools

**Chrome DevTools:**
- Network tab: Xem API calls
- Console tab: Xem errors
- Application → Local Storage: Xem data (đã xóa localStorage hooks)

**VS Code:**
- Terminal: Xem backend logs
- Problems tab: Xem TypeScript errors

**Supabase Dashboard:**
- Table Editor: Xem data trong database
- Logs: Xem database queries
- Auth: Xem users đã đăng ký

---

## 🚀 BƯỚC 7: DEPLOYMENT (Optional)

### 7.1. Deploy Backend lên Railway

1. Tạo account tại https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect GitHub repo
4. Railway tự động detect Node.js project
5. Trong Settings:
   - Root Directory: `src/backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Thêm Environment Variables (copy từ `.env`)
7. Deploy!

**Production URL:** `https://your-app.railway.app`

### 7.2. Deploy Frontend lên Vercel

1. Tạo account tại https://vercel.com
2. Import GitHub repo
3. Framework Preset: Vite
4. Root Directory: `src`
5. Thêm Environment Variables:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=https://your-app.railway.app/api
   ```
6. Deploy!

**Production URL:** `https://your-app.vercel.app`

### 7.3. Update CORS

Trong backend `.env` (Railway), update:
```env
CORS_ORIGIN=https://your-app.vercel.app
```

Redeploy backend.

### 7.4. Update Supabase Auth URLs

1. Vào Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://your-app.vercel.app`
3. Redirect URLs: 
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/auth/reset-password`

---

## ✅ HOÀN THÀNH!

Khi đã làm xong tất cả các bước trên, app của bạn sẽ:

✅ **Frontend:**
- Đăng ký/Đăng nhập với Supabase Auth
- Tạo/Sửa/Xóa projects
- Tạo/Sửa/Xóa tasks
- Invite members, manage roles
- Comments, attachments
- Notifications real-time
- Sprint management (Scrum)
- Kanban boards

✅ **Backend:**
- REST API với 60+ endpoints
- Authentication & Authorization
- Database persistence (Supabase PostgreSQL)
- File uploads (Supabase Storage)
- Real-time updates (Socket.IO)
- Logging & monitoring

✅ **Database:**
- 17 tables với relationships
- Row Level Security (RLS)
- Triggers tự động
- Backup & restore

---

## 📚 TÀI LIỆU THAM KHẢO

- **Backend API Docs:** `src/backend/docs/` (nếu có)
- **Database Schema:** `src/backend/database/migrations/01_create_tables.sql`
- **API Client:** `src/services/apiClient.ts`
- **Hooks API:** `src/hooks/use*API.ts`

---

## 💡 GỢI Ý TIẾP THEO

Sau khi hoàn thiện, bạn có thể:

1. **Thêm features:**
   - AI suggestions (GPT integration)
   - Email notifications
   - Export reports (PDF, Excel)
   - Time tracking
   - Gantt charts
   - Calendar view

2. **Improve UX:**
   - Skeleton loading
   - Optimistic updates
   - Error boundaries
   - Toast notifications

3. **Performance:**
   - React Query cho caching
   - Lazy loading components
   - Image optimization
   - Code splitting

4. **Security:**
   - Rate limiting frontend
   - XSS protection
   - CSRF tokens
   - Input sanitization

5. **Testing:**
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)
   - Load testing

---

Chúc bạn thành công! 🎉

Nếu gặp vấn đề, hãy check lại từng bước một cách cẩn thận và xem logs để debug.
