# 🚀 HƯỚNG DẪN SETUP SUPABASE CHO BACKEND

## 📋 TỔNG QUAN

Backend cần Supabase để lưu trữ:
- ✅ Database (PostgreSQL) - 17 tables
- ✅ Authentication (JWT tokens)
- ✅ Storage (File uploads)
- ✅ Row Level Security (RLS)

---

## 🎯 BƯỚC 1: TẠO PROJECT TRÊN SUPABASE

### 1.1. Truy cập Supabase
```
https://app.supabase.com
```

### 1.2. Tạo Project Mới
1. Click **"New Project"**
2. Điền thông tin:
   - **Name**: `planora` (hoặc tên bạn thích)
   - **Database Password**: Tạo password mạnh (lưu lại)
   - **Region**: `Southeast Asia (Singapore)` (gần Việt Nam nhất)
   - **Pricing Plan**: `Free` (đủ cho development)
3. Click **"Create new project"**
4. Đợi 2-3 phút để Supabase khởi tạo database

### 1.3. Lấy API Credentials
Sau khi project được tạo:

1. Vào **Settings** (icon bánh răng bên trái)
2. Click **API**
3. Copy các thông tin sau:

```
Project URL:      https://xxxxx.supabase.co
anon/public key:  eyJhbGc...  (JWT token dài)
service_role key: eyJhbGc...  (JWT token dài - BÍ MẬT!)
```

---

## 🔧 BƯỚC 2: CẤU HÌNH BACKEND

### 2.1. Tạo file `.env` trong thư mục backend

```bash
cd src/backend
touch .env
```

### 2.2. Thêm credentials vào `.env`

```env
# Server Config
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT (Supabase sử dụng)
JWT_SECRET=your-supabase-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS (Frontend URL)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# OpenAI (Optional - cho AI features)
OPENAI_API_KEY=sk-...

# Logging
LOG_LEVEL=debug
```

⚠️ **QUAN TRỌNG**: 
- `SUPABASE_SERVICE_ROLE_KEY` có quyền ADMIN - **KHÔNG BAO GIỜ** commit vào git
- Đã có `.gitignore` bảo vệ file `.env`

---

## 🗄️ BƯỚC 3: CHẠY SQL MIGRATIONS

### 3.1. Mở SQL Editor trong Supabase

1. Vào project Supabase của bạn
2. Click **SQL Editor** (icon database bên trái)
3. Click **"New query"**

### 3.2. Chạy Migration 1 - Tạo Tables

Copy toàn bộ nội dung file `01_create_tables.sql`:
```bash
src/backend/database/migrations/01_create_tables.sql
```

Paste vào SQL Editor và click **"Run"** (hoặc Ctrl+Enter)

✅ **Kết quả**: 17 tables được tạo thành công

### 3.3. Chạy Migration 2 - Enable RLS

Copy nội dung file `02_enable_rls.sql`:
```bash
src/backend/database/migrations/02_enable_rls.sql
```

Paste và Run

✅ **Kết quả**: Row Level Security được bật, tất cả policies được tạo

### 3.4. Chạy Migration 3 - Storage Buckets

Copy nội dung file `03_create_storage_buckets.sql`:
```bash
src/backend/database/migrations/03_create_storage_buckets.sql
```

Paste và Run

✅ **Kết quả**: 2 storage buckets được tạo (avatars, attachments)

### 3.5. Chạy Migration 4 - Triggers

Copy nội dung file `04_create_triggers.sql`:
```bash
src/backend/database/migrations/04_create_triggers.sql
```

Paste và Run

✅ **Kết quả**: Automation triggers được tạo

### 3.6. Verify Database Schema

Kiểm tra trong Supabase Dashboard:

1. Click **Table Editor** → Bạn sẽ thấy 17 tables:
   - users
   - user_preferences
   - projects
   - project_members
   - join_requests
   - sprints
   - boards
   - lists
   - tasks
   - task_assignees
   - labels
   - task_labels
   - comments
   - attachments
   - notifications
   - activity_logs
   - ai_interactions

2. Click vào từng table → Tab **"Policies"** → Verify RLS policies có tồn tại

---

## 🔐 BƯỚC 4: CẤU HÌNH AUTHENTICATION

### 4.1. Enable Email Auth

1. Vào **Authentication** → **Providers**
2. Verify **Email** provider đã được enable
3. Tùy chọn:
   - ✅ Enable email confirmations (khuyến nghị)
   - ✅ Enable password recovery
   - Minimum password length: **6** (hoặc cao hơn)

### 4.2. Configure Email Templates (Optional)

1. Vào **Authentication** → **Email Templates**
2. Customize các templates:
   - Confirm signup
   - Reset password
   - Magic link

### 4.3. Configure Auth Settings

1. Vào **Authentication** → **Settings**
2. **Site URL**: `http://localhost:5173` (frontend URL)
3. **Redirect URLs**: Thêm:
   ```
   http://localhost:5173/**
   http://localhost:3000/**
   ```

---

## 📦 BƯỚC 5: CẤU HÌNH STORAGE

### 5.1. Verify Storage Buckets

1. Vào **Storage** trong Supabase Dashboard
2. Verify 2 buckets đã được tạo:
   - **avatars** (public)
   - **attachments** (private)

### 5.2. Configure File Size Limits

**Bucket: avatars**
1. Click vào bucket `avatars`
2. Click **Configuration**
3. Settings:
   - Public: ✅ Yes
   - File size limit: `2 MB`
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

**Bucket: attachments**
1. Click vào bucket `attachments`
2. Click **Configuration**
3. Settings:
   - Public: ❌ No
   - File size limit: `10 MB`
   - Allowed MIME types: `*/*` (all types)

### 5.3. Test Storage Policies

Run trong SQL Editor:
```sql
-- Test: Xem policies đã được tạo chưa
SELECT * FROM storage.policies;
```

---

## 🧪 BƯỚC 6: TEST DATABASE CONNECTION

### 6.1. Test từ Backend

```bash
cd src/backend

# Install dependencies nếu chưa có
npm install

# Test connection
npm run test:db
```

Hoặc tạo file test đơn giản `test-db.js`:

```javascript
import { getSupabaseAdminClient } from './src/config/supabase.js';

async function testConnection() {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Test query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();
    
    if (error) throw error;
    
    console.log('✅ Database connection successful!');
    console.log('Tables found:', data);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

Run:
```bash
node test-db.js
```

---

## 🎨 BƯỚC 7: TẠO DỮ LIỆU MẪU (SEED DATA)

### 7.1. Tạo Admin User

Run trong SQL Editor:

```sql
-- Create admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@planora.com',
  crypt('admin123456', gen_salt('bf')), -- Password: admin123456
  NOW(),
  '{"name": "Admin User"}'::jsonb,
  NOW(),
  NOW()
);

-- The trigger will automatically create public.users record
```

### 7.2. Tạo Sample Project

```sql
-- Create sample project
WITH new_user AS (
  SELECT id FROM public.users WHERE email = 'admin@planora.com'
)
INSERT INTO public.projects (name, description, key, owner_id, template)
SELECT 
  'Sample Project',
  'This is a sample project for testing',
  'SAMPLE',
  id,
  'kanban'
FROM new_user;
```

### 7.3. Tạo Sample Tasks

```sql
-- Create sample tasks
WITH project AS (
  SELECT id FROM public.projects WHERE key = 'SAMPLE'
)
INSERT INTO public.tasks (project_id, title, description, status, priority)
SELECT 
  id,
  'Setup Development Environment',
  'Install Node.js, PostgreSQL, and configure environment variables',
  'todo',
  'high'
FROM project
UNION ALL
SELECT 
  id,
  'Implement User Authentication',
  'Add login, signup, and JWT token management',
  'in-progress',
  'high'
FROM project
UNION ALL
SELECT 
  id,
  'Create Database Schema',
  'Design and implement all database tables',
  'done',
  'medium'
FROM project;
```

---

## 🚀 BƯỚC 8: START BACKEND SERVER

### 8.1. Install Dependencies

```bash
cd src/backend
npm install
```

### 8.2. Start Development Server

```bash
npm run dev
```

Expected output:
```
🚀 Server running on port 3001
📊 Environment: development
🔗 API URL: http://localhost:3001/api
❤️  Health check: http://localhost:3001/health
```

### 8.3. Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"2026-01-08T...","version":"1.0.0"}
```

---

## 📊 BƯỚC 9: VERIFY SETUP

### 9.1. Check Database Tables

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 17 tables
```

### 9.2. Check RLS Policies

```sql
-- Count policies per table
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

### 9.3. Check Storage Buckets

```sql
SELECT * FROM storage.buckets;

-- Should show:
-- avatars (public=true)
-- attachments (public=false)
```

### 9.4. Check Triggers

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## 🔗 BƯỚC 10: KẾT NỐI FRONTEND

### 10.1. Cập nhật Frontend `.env`

```bash
cd src
touch .env
```

Thêm:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://localhost:3001/api
```

### 10.2. Test Full Stack

1. **Start Backend:**
   ```bash
   cd src/backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd src
   pnpm dev
   ```

3. **Test Registration:**
   - Vào http://localhost:5173
   - Register với email mới
   - Check Supabase Dashboard → Authentication → Users
   - Check Table Editor → users table

4. **Test Create Project:**
   - Login vào frontend
   - Create new project
   - Check Supabase → projects table
   - Check project_members table (owner được tự động add)

---

## 📝 CHECKLIST HOÀN TẤT

- [ ] Supabase project đã được tạo
- [ ] Đã có API credentials (URL, anon key, service_role key)
- [ ] File `.env` backend đã được cấu hình
- [ ] Đã chạy 4 migration files (tables, RLS, storage, triggers)
- [ ] Verify 17 tables xuất hiện trong Table Editor
- [ ] Verify RLS policies đã được tạo
- [ ] Verify 2 storage buckets đã được tạo
- [ ] Email authentication đã được enable
- [ ] Backend server chạy thành công (port 3001)
- [ ] Health check endpoint trả về 200 OK
- [ ] Frontend có thể đăng ký user mới
- [ ] Frontend có thể tạo project
- [ ] Real-time updates hoạt động (Socket.IO)

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Invalid API key"
**Nguyên nhân**: Sai SUPABASE_URL hoặc keys trong `.env`
**Giải pháp**: Verify lại credentials từ Supabase Dashboard → Settings → API

### Lỗi: "relation 'public.users' does not exist"
**Nguyên nhân**: Chưa chạy migration files
**Giải pháp**: Chạy lại `01_create_tables.sql`

### Lỗi: "new row violates row-level security policy"
**Nguyên nhân**: RLS policies chưa được setup đúng
**Giải pháp**: Chạy lại `02_enable_rls.sql`

### Lỗi: "Could not find the public key"
**Nguyên nhân**: Service role key không đúng
**Giải pháp**: Copy lại service_role key từ Supabase Dashboard

### Lỗi: "storage bucket not found"
**Nguyên nhân**: Storage buckets chưa được tạo
**Giải pháp**: Chạy lại `03_create_storage_buckets.sql`

### Backend không kết nối được database
1. Check `.env` file có đúng format không
2. Check SUPABASE_URL có `https://` prefix không
3. Check keys không có khoảng trắng thừa
4. Restart backend server: `npm run dev`

---

## 📚 TÀI LIỆU THAM KHẢO

- Supabase Documentation: https://supabase.com/docs
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Auth: https://supabase.com/docs/guides/auth

---

## 🎯 NEXT STEPS

Sau khi setup xong:

1. **Update Frontend Hooks**: Thay localStorage bằng API calls (xem file hướng dẫn trước)
2. **Setup Socket.IO**: Test real-time features
3. **Deploy to Production**: 
   - Deploy backend lên Railway/Render
   - Update Supabase production settings
   - Configure environment variables

---

**🎉 HOÀN TẤT! Database đã sẵn sàng cho backend!**
