# Custom Hooks - Planora

Thư mục này chứa các custom hooks được tách từ `App.tsx` để quản lý state và logic một cách modular.

## Tổng quan

| Hook | Mô tả | File |
|------|-------|------|
| `useAuth` | Xác thực người dùng | `useAuth.ts` |
| `useProjects` | Quản lý dự án | `useProjects.ts` |
| `useTasks` | Quản lý nhiệm vụ | `useTasks.ts` |
| `useSprints` | Quản lý Sprint (Scrum) | `useSprints.ts` |
| `useNotifications` | Quản lý thông báo | `useNotifications.ts` |
| `useSettings` | Cài đặt ứng dụng | `useSettings.ts` |

---

## Chi tiết từng Hook

### 1. `useAuth`

Quản lý xác thực người dùng.

```typescript
import { useAuth } from './hooks';

const {
  user,              // User hiện tại
  isLoading,         // Đang tải dữ liệu
  adminEmail,        // Email admin (nếu đăng nhập admin)
  handleLogin,       // Đăng nhập
  handleRegister,    // Đăng ký
  handleLogout,      // Đăng xuất
  handleUpdateUser,  // Cập nhật thông tin user
  handleAdminLogin,  // Đăng nhập admin
} = useAuth();
```

**Types:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
}
```

---

### 2. `useProjects`

Quản lý dự án, mời thành viên, yêu cầu tham gia.

```typescript
import { useProjects } from './hooks';

const {
  projects,                    // Danh sách dự án
  selectedProjectId,           // ID dự án đang chọn
  invitations,                 // Lời mời tham gia
  joinRequests,                // Yêu cầu tham gia
  handleUpdateProject,         // Cập nhật dự án
  handleDeleteProject,         // Xóa (chuyển thùng rác)
  handleRestoreProject,        // Khôi phục từ thùng rác
  handlePermanentlyDeleteProject, // Xóa vĩnh viễn
  handleSelectProject,         // Chọn dự án
  handleSendInvitation,        // Gửi lời mời
  handleAcceptInvitation,      // Chấp nhận lời mời
  handleRejectInvitation,      // Từ chối lời mời
  handleRequestJoinProject,    // Gửi yêu cầu tham gia
  handleApproveJoinRequest,    // Chấp nhận yêu cầu
  handleRejectJoinRequest,     // Từ chối yêu cầu
  getActiveProjects,           // Lấy dự án active
  getDeletedProjects,          // Lấy dự án đã xóa
} = useProjects({ user, onAddNotification });
```

**Types:**
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  ownerId: string;
  createdAt: string;
  template: 'kanban' | 'scrum';
  members: ProjectMember[];
  deletedAt?: string;
}

interface ProjectMember {
  userId: string;
  role: 'manager' | 'member';
  name: string;
  email: string;
  avatar?: string;
}
```

---

### 3. `useTasks`

Quản lý nhiệm vụ, bình luận, đính kèm.

```typescript
import { useTasks } from './hooks';

const {
  tasks,                       // Danh sách nhiệm vụ
  taskProposals,               // Đề xuất nhiệm vụ
  handleCreateTask,            // Tạo nhiệm vụ
  handleUpdateTask,            // Cập nhật nhiệm vụ
  handleDeleteTask,            // Xóa (chuyển thùng rác)
  handleRestoreTask,           // Khôi phục
  handlePermanentlyDeleteTask, // Xóa vĩnh viễn
  handleAddComment,            // Thêm bình luận
  handleAddAttachment,         // Thêm đính kèm
  handleProposeTask,           // Đề xuất nhiệm vụ
  handleApproveProposal,       // Duyệt đề xuất
  handleRejectProposal,        // Từ chối đề xuất
  getActiveTasks,              // Lấy task active
  getDeletedTasks,             // Lấy task đã xóa
  getTasksByProject,           // Lấy task theo dự án
} = useTasks({ user, onAddNotification });
```

**Types:**
```typescript
interface Task {
  id: string;
  projectId: string;
  type: 'user-story' | 'task';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'in-progress' | 'done';
  assignees: string[];
  deadline?: string;
  labels: string[];
  storyPoints?: number;
  parentTaskId?: string;
  sprintId?: string;
  createdBy: string;
  createdAt: string;
  comments: Comment[];
  attachments: Attachment[];
  deletedAt?: string;
}
```

**Tính năng đặc biệt:**
- Auto-update User Story status khi tất cả sub-tasks hoàn thành
- Tự động chuyển User Story về `in-progress` khi tạo task mới

---

### 4. `useSprints`

Quản lý Sprint cho template Scrum.

```typescript
import { useSprints } from './hooks';

const {
  sprints,                // Danh sách Sprint
  handleCreateSprint,     // Tạo Sprint mới
  handleEndSprint,        // Kết thúc Sprint
  getSprintsByProject,    // Lấy Sprint theo dự án
  getCurrentSprint,       // Lấy Sprint hiện tại
  getCompletedSprints,    // Lấy Sprint đã hoàn thành
} = useSprints({ tasks, setTasks });
```

**Types:**
```typescript
interface Sprint {
  id: string;
  name: string;
  goal: string;
  projectId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed';
}
```

**Tính năng đặc biệt:**
- Khi kết thúc Sprint: 
  - Tasks chưa done → chuyển về Backlog
  - Sub-tasks chưa done → reset về todo

---

### 5. `useNotifications`

Quản lý thông báo trong ứng dụng.

```typescript
import { useNotifications } from './hooks';

const {
  notifications,                    // Danh sách thông báo
  handleAddNotification,            // Thêm thông báo
  handleMarkNotificationAsRead,     // Đánh dấu đã đọc
  handleMarkAllNotificationsAsRead, // Đánh dấu tất cả đã đọc
  handleDeleteNotification,         // Xóa thông báo
  getUnreadCount,                   // Đếm chưa đọc
  getNotificationsByUser,           // Lấy theo user
} = useNotifications();
```

**Types:**
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'member_added' | 'project_update' | 'task_mentioned';
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}
```

---

### 6. `useSettings`

Quản lý cài đặt ứng dụng.

```typescript
import { useSettings } from './hooks';

const {
  settings,                    // Cài đặt hiện tại
  handleUpdateSettings,        // Cập nhật toàn bộ
  toggleTheme,                 // Chuyển dark/light mode
  updateNotificationSettings,  // Cập nhật cài đặt thông báo
  linkAccount,                 // Liên kết tài khoản
  unlinkAccount,               // Hủy liên kết
} = useSettings();
```

**Types:**
```typescript
interface Settings {
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
  notifications: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    projectUpdates: boolean;
    emailNotifications: boolean;
  };
  linkedAccounts: {
    google?: { email: string; linkedAt: string };
    facebook?: { email: string; linkedAt: string };
    github?: { email: string; linkedAt: string };
  };
}
```

---

## Cách sử dụng trong App.tsx

```typescript
import {
  useAuth,
  useProjects,
  useTasks,
  useSprints,
  useNotifications,
  useSettings,
} from './hooks';

function App() {
  // Auth
  const { user, handleLogin, handleLogout } = useAuth();
  
  // Notifications (cần trước để truyền vào các hook khác)
  const { notifications, handleAddNotification } = useNotifications();
  
  // Settings
  const { settings, handleUpdateSettings } = useSettings();
  
  // Projects
  const {
    projects,
    handleUpdateProject,
    handleSelectProject,
  } = useProjects({ user, onAddNotification: handleAddNotification });
  
  // Tasks
  const {
    tasks,
    setTasks,
    handleCreateTask,
    handleUpdateTask,
  } = useTasks({ user, onAddNotification: handleAddNotification });
  
  // Sprints
  const {
    sprints,
    handleCreateSprint,
    handleEndSprint,
  } = useSprints({ tasks, setTasks });
  
  // ... render components
}
```

---

## Lưu ý

1. **Persistence**: Tất cả hooks tự động lưu data vào `localStorage`
2. **Dependencies**: Một số hooks phụ thuộc vào nhau (ví dụ: `useSprints` cần `tasks` và `setTasks` từ `useTasks`)
3. **Notifications**: Truyền `onAddNotification` để các hook có thể gửi thông báo

---

## Lợi ích của việc tách hooks

| Trước | Sau |
|-------|-----|
| App.tsx > 1000 dòng | Mỗi hook ~100-200 dòng |
| Logic rối rắm | Logic tách biệt, dễ đọc |
| Khó test | Dễ unit test từng hook |
| Khó maintain | Dễ maintain, mở rộng |
| Khó reuse | Có thể reuse trong các component khác |
