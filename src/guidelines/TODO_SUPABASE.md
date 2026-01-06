# 📋 Danh sách công việc - Supabase Integration

> 📅 Cập nhật: 07/01/2026  
> 📊 Trạng thái: Đánh giá sau khi migrate từ localStorage

---

## Tổng quan

| Trạng thái | Mô tả |
|------------|-------|
| ✅ | Đã hoàn thành |
| 🔴 | Cần làm (quan trọng) |
| 🟡 | Tùy chọn (nếu cần feature) |
| 🟢 | Không cần thiết hiện tại |

---

## ✅ Đã hoàn thành

| Feature | Service/Hook | Ghi chú |
|---------|--------------|---------|
| Authentication | `useSupabaseAuth.ts` | Login, Register, Logout, Password reset |
| Projects CRUD | `projectService.ts` → `useProjects.ts` | Create, Read, Update, Delete (soft + permanent) |
| Project Members | `projectService.ts` | Add, Remove members |
| Join Requests / Invitations | `projectService.ts` | Send invite, Accept/Reject |
| Tasks CRUD | `taskService.ts` → `useTasks.ts` | Create, Read, Update, Delete |
| Task Assignees | `taskService.ts` | Multiple assignees per task |
| Comments | `taskService.ts` | Add comments to tasks |
| Attachments | `taskService.ts` | Add file attachments |
| Sprints | `sprintService.ts` → `useSprints.ts` | Create, End sprint, Assign tasks |
| Notifications | `notificationService.ts` → `useNotifications.ts` | Create, Mark as read, Delete |
| User Settings | `useSettings.ts` | Theme, Language, Notification preferences |
| Task Proposals | `taskService.ts` (via activity_logs) | Propose, Approve, Reject |

---

## 🔴 Cần làm (Quan trọng)

### 1. Labels Service

**Vấn đề:** Database có tables `labels` và `task_labels`, nhưng chưa có service để quản lý. Khi tạo/update task, labels chưa được lưu vào DB.

**Công việc:**
- [ ] Tạo `services/labelService.ts` với các hàm:
  - `fetchLabels(projectId)` 
  - `createLabel(projectId, name, color)`
  - `updateLabel(labelId, updates)`
  - `deleteLabel(labelId)`
- [ ] Cập nhật `taskService.ts`:
  - Thêm logic lưu labels khi `createTask()`
  - Thêm logic cập nhật labels khi `updateTask()`
- [ ] (Tùy chọn) Tạo `hooks/useLabels.ts`

**Code mẫu cần thêm trong `taskService.ts`:**
```typescript
// Trong createTask(), sau khi tạo task:
if (task.labels.length > 0) {
    // Tìm label IDs từ tên
    const { data: existingLabels } = await supabase
        .from('labels')
        .select('id, name')
        .eq('project_id', task.projectId)
        .in('name', task.labels);
    
    const labelIds = (existingLabels || []).map(l => l.id);
    
    if (labelIds.length > 0) {
        const taskLabelsInsert = labelIds.map(labelId => ({
            task_id: data.id,
            label_id: labelId,
        }));
        await supabase.from('task_labels').insert(taskLabelsInsert);
    }
}
```

---

### 2. Sync Users với Supabase Auth

**Vấn đề:** Khi user đăng ký qua Supabase Auth, cần tự động tạo row trong `public.users`.

**Công việc:**
- [ ] Tạo trigger trong Supabase Dashboard hoặc migration:

```sql
-- Trigger tự động tạo user khi signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

- [ ] Kiểm tra trigger đã hoạt động sau khi đăng ký mới

---

## 🟡 Tùy chọn (Nếu cần feature)

### 3. Boards & Lists (Custom Kanban Columns)

**Ý nghĩa:**
- **Boards**: Cho phép có nhiều Kanban boards trong một project
- **Lists**: Cho phép custom columns (thay vì chỉ có `todo`, `in-progress`, `done`)

**Hiện tại:**
- Status được hardcode: `backlog`, `todo`, `in-progress`, `done`
- Chưa cho phép user tạo custom columns

**Khi nào cần implement:**
- Khi muốn user tự tạo columns như "Review", "Testing", "Blocked"
- Khi muốn có nhiều boards trong một project

**Công việc (nếu cần):**
- [ ] Tạo `services/boardService.ts`
- [ ] Tạo `hooks/useBoards.ts`
- [ ] Update `KanbanView.tsx` để load columns từ DB thay vì hardcode

**Khuyến nghị:** 🟢 **KHÔNG CẦN THIẾT** cho MVP. Status hardcode đủ cho usecase cơ bản.

---

### 4. Activity Logs (Audit Trail)

**Ý nghĩa:** Track mọi thay đổi trong hệ thống (ai làm gì, khi nào)

**Hiện tại:** Chỉ dùng cho Task Proposals

**Khi nào cần implement:**
- Khi cần hiển thị "Activity History" trong task/project
- Khi cần audit cho compliance

**Công việc (nếu cần):**
- [ ] Thêm logging trong các service functions
- [ ] Tạo component hiển thị activity history

**Khuyến nghị:** 🟢 **KHÔNG CẦN THIẾT** cho MVP.

---

### 5. AI Interactions Logging

**Ý nghĩa:** Track AI usage để analytics, billing, feedback

**Hiện tại:** `aiService.ts` gọi Edge Functions nhưng không log vào `ai_interactions` table

**Khi nào cần implement:**
- Khi cần statistics về AI usage
- Khi muốn user rate AI suggestions

**Công việc (nếu cần):**
- [ ] Update `aiService.ts` để insert vào `ai_interactions` sau mỗi call

**Khuyến nghị:** 🟢 **KHÔNG CẦN THIẾT** cho MVP.

---

## 📊 Tóm tắt ưu tiên

| Ưu tiên | Công việc | Effort | Impact |
|---------|-----------|--------|--------|
| **1** | Labels Service | 2-3h | Cao (nếu dùng labels) |
| **2** | Users Trigger | 30 phút | Cao (critical cho auth) |
| **3** | Boards/Lists | 4-6h | Thấp (không cần cho MVP) |
| **4** | Activity Logs | 2-3h | Thấp (nice-to-have) |
| **5** | AI Logging | 1h | Thấp (analytics only) |

---

## 🎯 Khuyến nghị cho Team

### Nếu **deadline gấp**:
1. ✅ Chỉ cần làm **Labels Service** (nếu UI đang dùng labels)
2. ✅ Tạo **Users Trigger** trong Supabase

### Nếu **có thời gian mở rộng**:
3. Custom Kanban columns (Boards/Lists)
4. Activity History

---

## 📝 Notes

- Tables `boards` và `lists` **KHÔNG CẦN THIẾT** cho MVP
- Nếu không dùng labels trong UI, có thể bỏ qua Labels Service
- Users Trigger **RẤT QUAN TRỌNG** - kiểm tra đã có trong Supabase chưa

---

*📄 File này được tạo để track công việc còn lại sau khi migrate sang Supabase.*
