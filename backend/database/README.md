# 📁 Database Migrations

Thư mục này chứa tất cả SQL migration files để setup database trên Supabase.

## 📂 Cấu Trúc

```
database/
├── migrations/
│   ├── 01_create_tables.sql       # Tạo 17 tables
│   ├── 02_enable_rls.sql          # Row Level Security policies
│   ├── 03_create_storage_buckets.sql # Storage cho files
│   ├── 04_create_triggers.sql     # Automation triggers
│   └── 05_seed_data.sql           # Dữ liệu mẫu (optional)
└── SETUP_GUIDE.md                  # Hướng dẫn chi tiết

```

## 🚀 Quick Start

### Yêu Cầu

- Supabase account (free tier)
- PostgreSQL 15+ (Supabase tự động cung cấp)

### Các Bước Setup

1. **Tạo Supabase Project**
   ```
   https://app.supabase.com → New Project
   ```

2. **Lấy API Credentials**
   ```
   Settings → API → Copy URL & Keys
   ```

3. **Cấu hình Backend `.env`**
   ```env
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

4. **Chạy Migrations theo thứ tự**
   
   Mở **SQL Editor** trong Supabase Dashboard:
   
   ```sql
   -- Bước 1: Tạo tables
   -- Copy & paste nội dung 01_create_tables.sql
   
   -- Bước 2: Enable RLS
   -- Copy & paste nội dung 02_enable_rls.sql
   
   -- Bước 3: Setup Storage
   -- Copy & paste nội dung 03_create_storage_buckets.sql
   
   -- Bước 4: Tạo Triggers
   -- Copy & paste nội dung 04_create_triggers.sql
   
   -- Bước 5 (Optional): Seed data
   -- Copy & paste nội dung 05_seed_data.sql
   ```

5. **Verify Setup**
   ```bash
   cd src/backend
   npm run dev
   curl http://localhost:3001/health
   ```

## 📊 Database Schema Overview

### Core Tables (17 total)

| Table | Mô Tả | Quan Hệ |
|-------|-------|---------|
| **users** | User profiles | 1-many với projects |
| **user_preferences** | User settings | 1-1 với users |
| **projects** | Projects | Belongs to user (owner) |
| **project_members** | Members của project | Many-to-many |
| **join_requests** | Invitations/requests | Links users ↔ projects |
| **sprints** | Scrum sprints | Belongs to project |
| **boards** | Kanban boards | Belongs to project |
| **lists** | Kanban columns | Belongs to board |
| **tasks** | Tasks/User stories | Belongs to project |
| **task_assignees** | Task assignments | Many-to-many |
| **labels** | Task tags | Belongs to project |
| **task_labels** | Task-Label links | Many-to-many |
| **comments** | Task comments | Belongs to task |
| **attachments** | File uploads | Belongs to task |
| **notifications** | User notifications | Belongs to user |
| **activity_logs** | Audit trail | Belongs to project |
| **ai_interactions** | AI usage logs | Belongs to user |

### Relationships Diagram

```
users ─┬─→ user_preferences (1:1)
       ├─→ projects (1:many) [owner]
       ├─→ project_members (many:many)
       ├─→ task_assignees (many:many)
       └─→ notifications (1:many)

projects ─┬─→ project_members (many:many)
          ├─→ sprints (1:many)
          ├─→ boards (1:many)
          ├─→ tasks (1:many)
          ├─→ labels (1:many)
          └─→ activity_logs (1:many)

tasks ─┬─→ task_assignees (many:many)
       ├─→ task_labels (many:many)
       ├─→ comments (1:many)
       ├─→ attachments (1:many)
       └─→ tasks (parent-child)

boards ─→ lists (1:many)
sprints ─→ tasks (1:many)
```

## 🔐 Row Level Security (RLS)

Tất cả tables đều có RLS enabled với policies:

- ✅ **Users**: Chỉ xem/sửa profile của mình
- ✅ **Projects**: Chỉ members mới xem được
- ✅ **Tasks**: Chỉ project members mới truy cập
- ✅ **Comments**: Chỉ project members mới xem
- ✅ **Notifications**: Chỉ xem thông báo của mình

**Service Role Key** bypass RLS → Backend dùng key này để có full access.

## 🤖 Automation Triggers

Backend tự động xử lý:

1. **on_auth_user_created**: Tạo `public.users` + `user_preferences` khi signup
2. **on_project_created**: Thêm owner vào `project_members`
3. **on_task_assigned**: Tạo notification khi assign task
4. **task_activity_log**: Log mọi thay đổi vào `activity_logs`
5. **on_comment_created**: Notify assignees khi có comment
6. **update_parent_task_status**: Update parent khi subtasks thay đổi
7. **calculate_velocity_on_sprint_end**: Tính velocity khi sprint kết thúc
8. **on_project_soft_delete**: Soft delete cascade tasks

## 📦 Storage Buckets

### avatars (Public)
- **Purpose**: User profile pictures
- **Access**: Public read, authenticated write
- **Max size**: 2MB
- **Formats**: JPEG, PNG, GIF, WebP

### attachments (Private)
- **Purpose**: Task attachments
- **Access**: Project members only
- **Max size**: 10MB
- **Formats**: All types

## 🧪 Testing

### Test Database Connection

```bash
cd src/backend
node -e "
const { getSupabaseAdminClient } = require('./src/config/supabase.js');
const supabase = getSupabaseAdminClient();
supabase.from('users').select('count').then(r => console.log('✅ Connected:', r));
"
```

### Test RLS Policies

```sql
-- Set current user context
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

-- Try to select projects (should only see projects user is member of)
SELECT * FROM public.projects;
```

### Test Triggers

```sql
-- Create a task → Should auto-create activity log
INSERT INTO public.tasks (project_id, title, created_by)
VALUES ('10000000-0000-0000-0000-000000000001', 'Test Task', auth.uid());

-- Check activity logs
SELECT * FROM public.activity_logs WHERE entity_type = 'task' ORDER BY created_at DESC LIMIT 1;
```

## 🔄 Migration Best Practices

### Rollback Strategy

Nếu cần rollback một migration:

```sql
-- Ví dụ: Rollback table creation
DROP TABLE IF EXISTS public.table_name CASCADE;

-- Rollback trigger
DROP TRIGGER IF EXISTS trigger_name ON table_name;
DROP FUNCTION IF EXISTS function_name();

-- Rollback RLS policy
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Backup Database

Trước khi chạy migrations quan trọng:

1. **Via Supabase Dashboard**:
   ```
   Database → Backups → Create backup
   ```

2. **Via pg_dump**:
   ```bash
   pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
   ```

## 📝 Sample Data

File `05_seed_data.sql` tạo:

- 4 users (1 admin, 3 regular)
- 3 projects (Kanban + Scrum)
- 3 sprints
- 7 tasks với assignments
- 3 comments
- 3 notifications

**Test Accounts**:
```
admin@planora.com : password123
john.doe@example.com : password123
jane.smith@example.com : password123
bob.wilson@example.com : password123
```

## 🐛 Common Issues

### Error: "relation already exists"
**Solution**: Drop existing tables trước khi chạy lại migration
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Error: "function does not exist"
**Solution**: Chạy lại `04_create_triggers.sql`

### Error: "insufficient privileges"
**Solution**: Verify đang dùng correct Supabase service role key

### Storage policies không hoạt động
**Solution**: 
1. Check buckets đã được tạo chưa
2. Verify policies trong `storage.policies` table
3. Chạy lại `03_create_storage_buckets.sql`

## 🔗 Related Documentation

- [Full Setup Guide](./SETUP_GUIDE.md) - Chi tiết từng bước
- [Backend README](../README.md) - Backend architecture
- [Supabase Docs](https://supabase.com/docs) - Official docs
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) - Row Level Security

## 📞 Support

Nếu gặp vấn đề:

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Verify `.env` credentials
3. Check Supabase Dashboard → Logs
4. Review SQL Editor errors

---

**🎉 Happy Coding!**
