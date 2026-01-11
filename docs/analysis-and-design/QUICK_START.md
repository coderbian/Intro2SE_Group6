# 🚀 QUICK START - HOÀN THIỆN APP TRONG 1 GIỜ

## ⚡ TÓM TẮT VẤN ĐỀ

**Hiện tại:**
- Backend ✅ Hoàn chỉnh (Express.js, 60+ APIs)
- Frontend ✅ UI đã xong (React, Components)
- Database ❌ Chưa deploy (migrations có sẵn)
- Integration ❌ FrontenÔNG gọi Backend

**Mục tiêu:** Kết nối Frontend → Backend → Database
d đang dùng localStorage, KH
---

## 📋 CHECKLIST 7 BƯỚC (1 GIỜ)

### ☐ BƯỚC 1: Deploy Database (15 phút)
1. Vào https://app.supabase.com → SQL Editor
2. Chạy lần lượt 5 files trong `src/backend/database/migrations/`:
   - `01_create_tables.sql` (17 tables)
   - `02_enable_rls.sql` (security)
   - `03_create_storage_buckets.sql` (file storage)
   - `04_create_triggers.sql` (automation)
   - `05_seed_data.sql` (optional - test data)

### ☐ BƯỚC 2: Start Backend (5 phút)
1. Tạo `src/backend/.env`:
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=your_url_from_supabase
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=random_string_min_32_chars
CORS_ORIGIN=http://localhost:5173
```

2. Start backend:
```bash
cd src/backend
npm install
npm run dev
```

3. Test: `curl http://localhost:3001/health`

### ☐ BƯỚC 3: Config Frontend (2 phút)
Thêm vào `src/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### ☐ BƯỚC 4: Thay Hooks (5 phút)
Mở `src/contexts/AppContext.tsx`, đổi imports:

```typescript
// XÓA (localStorage hooks)
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useSprints } from '../hooks/useSprints';
import { useNotifications } from '../hooks/useNotifications';

// THÊM (API hooks)
import { useProjects } from '../hooks/useProjectsAPI';
import { useTasks } from '../hooks/useTasksAPI';
import { useSprints } from '../hooks/useSprintsAPI';
import { useNotifications } from '../hooks/useNotificationsAPI';
```

Thêm effect load data khi chọn project (sau khi define hooks):

```typescript
// Load tasks and sprints when project is selected
useEffect(() => {
  if (selectedProjectId) {
    fetchTasksForProject(selectedProjectId);
    fetchSprintsForProject(selectedProjectId);
  }
}, [selectedProjectId, fetchTasksForProject, fetchSprintsForProject]);
```

### ☐ BƯỚC 5: Restart Frontend (1 phút)
```bash
cd src
npm run dev
```

### ☐ BƯỚC 6: Test (10 phút)
1. Mở app, đăng nhập
2. Tạo project mới → Kiểm tra Network tab (F12) → Phải thấy `POST /api/projects`
3. Tạo task → Phải thấy `POST /api/projects/{id}/tasks`
4. Refresh trang → Data phải còn (không mất)
5. Mở 2 tabs khác nhau → Test real-time updates

### ☐ BƯỚC 7: Socket.IO (Optional - 20 phút)
Nếu muốn real-time updates:

1. Install:
```bash
cd src
npm install socket.io-client
```

2. Copy code từ file `INTEGRATION_ROADMAP.md` → Section "BƯỚC 5: SOCKET.IO REAL-TIME"

---

## 🎯 FILES ĐÃ TẠO SẴN

Tôi đã tạo sẵn các files sau cho bạn:

✅ **API Client:**
- `src/services/apiClient.ts` - Base client + All API functions

✅ **New Hooks (gọi Backend API):**
- `src/hooks/useProjectsAPI.ts` - Projects CRUD + Members
- `src/hooks/useTasksAPI.ts` - Tasks CRUD + Comments + Attachments
- `src/hooks/useSprintsAPI.ts` - Sprint management
- `src/hooks/useNotificationsAPI.ts` - Notifications

✅ **Docs:**
- `INTEGRATION_ROADMAP.md` - Hướng dẫn chi tiết đầy đủ (đọc nếu gặp vấn đề)

---

## 🐛 TROUBLESHOOTING

**Backend không start:**
- Check file `.env` có đúng path: `src/backend/.env`
- Check Supabase keys đã copy đúng chưa

**CORS Error:**
- Check `CORS_ORIGIN=http://localhost:5173` trong backend `.env`
- Restart backend sau khi thay đổi `.env`

**401 Unauthorized:**
- User đã login chưa?
- Check Supabase Auth token trong Network tab (Headers)

**Database Error:**
- Migrations chưa chạy → Quay lại Bước 1

**Import Error:**
- Restart TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Check file paths trong imports

---

## 📖 CHI TIẾT ĐẦY ĐỦ

Đọc file `INTEGRATION_ROADMAP.md` để có:
- Giải thích từng bước chi tiết
- Code examples đầy đủ
- Testing scenarios
- Deployment guide
- Troubleshooting mở rộng

---

## 💡 TIPS

1. **Làm từng bước một** - Đừng skip bước nào
2. **Check logs** - Backend terminal, Browser Console, Network tab
3. **Test ngay sau mỗi bước** - Đừng đợi đến cuối mới test
4. **Dùng Git** - Commit sau mỗi bước thành công
5. **Đọc errors cẩn thận** - Error messages thường rất clear

---

**Tổng thời gian:** ~1 giờ (không tính Socket.IO)

Bắt đầu từ **BƯỚC 1** ngay! 🚀
