# ✅ SUPABASE SETUP CHECKLIST

Sử dụng checklist này để theo dõi tiến độ setup database.

---

## 📋 PRE-REQUISITES

- [ ] Có Supabase account (https://app.supabase.com)
- [ ] Đã cài Node.js version 18+
- [ ] Đã cài npm/pnpm
- [ ] Có text editor (VS Code khuyến nghị)

---

## 🎯 PHASE 1: SUPABASE PROJECT SETUP

### Tạo Project
- [ ] Đăng nhập Supabase Dashboard
- [ ] Click "New Project"
- [ ] Điền Project Name: `planora`
- [ ] Tạo Database Password (LƯU LẠI!)
- [ ] Chọn Region: `Southeast Asia (Singapore)`
- [ ] Chọn Pricing Plan: `Free`
- [ ] Click "Create new project"
- [ ] Đợi project khởi tạo (2-3 phút)

### Lấy Credentials
- [ ] Vào Settings → API
- [ ] Copy `Project URL`
- [ ] Copy `anon/public key`
- [ ] Copy `service_role key` (⚠️ BÍ MẬT!)
- [ ] Lưu vào file an toàn (password manager)

---

## 🔧 PHASE 2: BACKEND CONFIGURATION

### Setup Environment Variables
- [ ] Tạo file `src/backend/.env`
- [ ] Thêm `SUPABASE_URL`
- [ ] Thêm `SUPABASE_ANON_KEY`
- [ ] Thêm `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Thêm các biến khác (PORT, CORS, etc.)
- [ ] Verify `.env` trong `.gitignore`

### Install Dependencies
- [ ] `cd src/backend`
- [ ] `npm install`
- [ ] Verify không có error

---

## 🗄️ PHASE 3: DATABASE MIGRATIONS

### Migration 1: Tables
- [ ] Mở Supabase Dashboard → SQL Editor
- [ ] Click "New query"
- [ ] Copy nội dung `01_create_tables.sql`
- [ ] Paste vào SQL Editor
- [ ] Click "Run" (hoặc Ctrl+Enter)
- [ ] Verify success message
- [ ] Check Table Editor → Thấy 17 tables

### Migration 2: Row Level Security
- [ ] New query trong SQL Editor
- [ ] Copy nội dung `02_enable_rls.sql`
- [ ] Paste và Run
- [ ] Verify success message
- [ ] Check bất kỳ table → Tab "Policies" → Thấy policies

### Migration 3: Storage Buckets
- [ ] New query trong SQL Editor
- [ ] Copy nội dung `03_create_storage_buckets.sql`
- [ ] Paste và Run
- [ ] Verify success message
- [ ] Check Storage → Thấy `avatars` và `attachments` buckets

### Migration 4: Triggers & Functions
- [ ] New query trong SQL Editor
- [ ] Copy nội dung `04_create_triggers.sql`
- [ ] Paste và Run
- [ ] Verify success message
- [ ] Check Database → Functions → Thấy helper functions

### Migration 5: Seed Data (Optional)
- [ ] New query trong SQL Editor
- [ ] Copy nội dung `05_seed_data.sql`
- [ ] Paste và Run
- [ ] Verify success message
- [ ] Check Table Editor → `users` table → Thấy 4 sample users

---

## 🔐 PHASE 4: AUTHENTICATION SETUP

### Configure Auth Settings
- [ ] Vào Authentication → Providers
- [ ] Verify Email provider enabled
- [ ] Bật "Enable email confirmations" (khuyến nghị)
- [ ] Set minimum password length: 6+

### Site Configuration
- [ ] Vào Authentication → URL Configuration
- [ ] Set Site URL: `http://localhost:5173`
- [ ] Add Redirect URLs:
  - [ ] `http://localhost:5173/**`
  - [ ] `http://localhost:3000/**`

### Email Templates (Optional)
- [ ] Vào Authentication → Email Templates
- [ ] Review "Confirm signup" template
- [ ] Review "Reset password" template
- [ ] Customize nếu cần

---

## 📦 PHASE 5: STORAGE CONFIGURATION

### Configure Avatars Bucket
- [ ] Vào Storage → Click `avatars`
- [ ] Click Configuration
- [ ] Verify Public: ✅ Yes
- [ ] Set File size limit: `2 MB`
- [ ] Set Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

### Configure Attachments Bucket
- [ ] Vào Storage → Click `attachments`
- [ ] Click Configuration
- [ ] Verify Public: ❌ No
- [ ] Set File size limit: `10 MB`
- [ ] Allowed MIME types: `*/*` (all)

---

## 🧪 PHASE 6: TESTING

### Test Database Connection
- [ ] `cd src/backend`
- [ ] `npm run dev`
- [ ] Server start thành công
- [ ] Không có database connection errors

### Test Health Endpoint
- [ ] Mở browser: `http://localhost:3001/health`
- [ ] Response: `{"status":"ok",...}`

### Test Authentication
- [ ] Frontend đang chạy (`cd src && pnpm dev`)
- [ ] Truy cập register page
- [ ] Đăng ký user mới
- [ ] Check Supabase → Authentication → Users
- [ ] Thấy user vừa tạo

### Test Database Operations
- [ ] Login vào frontend
- [ ] Tạo project mới
- [ ] Check Supabase → Table Editor → `projects`
- [ ] Thấy project vừa tạo
- [ ] Check `project_members` table
- [ ] Owner đã được tự động thêm vào

### Test Real-time (Socket.IO)
- [ ] Mở 2 browser tabs với cùng project
- [ ] Tab 1: Tạo task mới
- [ ] Tab 2: Task hiện ra ngay lập tức
- [ ] Real-time updates hoạt động

---

## 🔍 PHASE 7: VERIFICATION

### Database Schema
- [ ] 17 tables tồn tại
- [ ] Tất cả tables có RLS enabled
- [ ] Foreign keys đã được setup
- [ ] Indexes đã được tạo

### Security
- [ ] RLS policies hoạt động
- [ ] Service role key không bị expose
- [ ] `.env` trong `.gitignore`
- [ ] CORS đã được cấu hình đúng

### Storage
- [ ] 2 buckets đã được tạo
- [ ] Storage policies hoạt động
- [ ] File size limits đã set
- [ ] MIME type restrictions đã set

### Automation
- [ ] Trigger `on_auth_user_created` hoạt động
- [ ] Trigger `on_project_created` hoạt động
- [ ] Activity logs được tạo tự động
- [ ] Notifications được gửi tự động

---

## 📊 PHASE 8: MONITORING

### Setup Monitoring
- [ ] Check Supabase → Reports
- [ ] Review Database usage
- [ ] Review API requests count
- [ ] Review Storage usage

### Logs
- [ ] Check Supabase → Logs → Postgres Logs
- [ ] Verify không có errors
- [ ] Check API Logs
- [ ] Verify requests thành công

---

## 🚀 PHASE 9: PRODUCTION READINESS

### Security Checklist
- [ ] Review tất cả RLS policies
- [ ] Test với multiple user roles
- [ ] Verify admin-only endpoints
- [ ] Test file upload security

### Performance
- [ ] Indexes trên các foreign keys
- [ ] Query performance acceptable
- [ ] API response times < 500ms
- [ ] Real-time latency < 100ms

### Backup Strategy
- [ ] Enable automatic backups (Supabase Dashboard)
- [ ] Test manual backup creation
- [ ] Document restore procedure

---

## 📝 NOTES & ISSUES

### Issues Encountered
```
Date: ___________
Issue: ___________________________________________
Solution: ________________________________________
```

### Performance Metrics
```
Date: ___________
API Latency: _____ ms
Database Size: _____ MB
Active Users: _____
```

### Next Steps
```
Priority 1: ______________________________________
Priority 2: ______________________________________
Priority 3: ______________________________________
```

---

## ✅ COMPLETION

- [ ] **ALL PHASES COMPLETED**
- [ ] **BACKEND RUNNING SUCCESSFULLY**
- [ ] **FRONTEND CONNECTED**
- [ ] **REAL-TIME WORKING**
- [ ] **READY FOR DEVELOPMENT**

---

**🎉 CONGRATULATIONS! Your Supabase database is ready!**

Date Completed: ___________
Team Members: ___________
