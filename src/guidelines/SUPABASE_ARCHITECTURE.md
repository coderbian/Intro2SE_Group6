# Hướng dẫn Kiến trúc Supabase - Planora

> 📅 Cập nhật: 07/01/2026  
> 👥 Dành cho: Team Development Group 6

---

## 📋 Mục lục

1. [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
3. [Chi tiết từng layer](#chi-tiết-từng-layer)
4. [Hướng dẫn thêm tính năng mới](#hướng-dẫn-thêm-tính-năng-mới)
5. [Hướng dẫn sửa code có sẵn](#hướng-dẫn-sửa-code-có-sẵn)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Tổng quan kiến trúc

Project sử dụng kiến trúc **3 tầng (3-layer)** để tách biệt UI, business logic, và data access:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPONENTS (UI Layer)                        │
│   ProjectPage, KanbanView, ScrumView, TaskDialog, etc.              │
│   📂 src/components/                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ uses useApp() hook
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTEXTS & HOOKS (Business Logic Layer)           │
│   AppContext.tsx → useProjects, useTasks, useSprints, useAuth       │
│   📂 src/contexts/ & src/hooks/                                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ calls service functions
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICES (Data Access Layer)                   │
│   projectService, taskService, sprintService, notificationService   │
│   📂 src/services/                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ uses getSupabaseClient()
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       LIB (Supabase Client Singleton)                │
│   supabase-client.ts                                                 │
│   📂 src/lib/                                                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ REST API calls
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                                    │
│   PostgreSQL Database + Auth + Storage + Edge Functions             │
└─────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Không dùng localStorage cho data nữa!** Tất cả dữ liệu được lưu trên Supabase.

---

## Cấu trúc thư mục

```
src/
├── lib/
│   ├── supabase-client.ts     # ⭐ Supabase client singleton
│   ├── aiService.ts           # AI features (edge functions)
│   └── utils.ts
│
├── types/
│   └── supabase.ts            # ⭐ Auto-generated DB types
│
├── services/                   # ⭐ DATA ACCESS LAYER
│   ├── index.ts               # Export tất cả services
│   ├── projectService.ts      # CRUD cho projects
│   ├── taskService.ts         # CRUD cho tasks, comments, attachments
│   ├── sprintService.ts       # CRUD cho sprints
│   └── notificationService.ts # CRUD cho notifications
│
├── hooks/                      # ⭐ BUSINESS LOGIC LAYER
│   ├── index.ts               # Export tất cả hooks
│   ├── useAuth.ts             # Re-export useSupabaseAuth
│   ├── useSupabaseAuth.ts     # Authentication logic
│   ├── useProjects.ts         # Project state management
│   ├── useTasks.ts            # Task state management
│   ├── useSprints.ts          # Sprint state management
│   ├── useNotifications.ts    # Notification state management
│   └── useSettings.ts         # User settings
│
├── contexts/
│   ├── AppContext.tsx         # ⭐ Global state provider
│   └── AuthContext.tsx        # Auth context (optional)
│
└── components/                 # UI LAYER
    ├── project/
    │   ├── ProjectPage.tsx
    │   ├── KanbanView.tsx
    │   ├── ScrumView.tsx
    │   └── TaskDialog.tsx
    └── ...
```

---

## Chi tiết từng layer

### 1️⃣ `lib/supabase-client.ts` - Supabase Client

Đây là **điểm khởi tạo DUY NHẤT** cho Supabase client:

```typescript
import { getSupabaseClient } from '../lib/supabase-client';

// Sử dụng trong services
const supabase = getSupabaseClient();
const { data, error } = await supabase.from('tasks').select('*');
```

> [!CAUTION]
> **KHÔNG** tạo client mới bằng `createClient()` trực tiếp!  
> Luôn dùng `getSupabaseClient()` để đảm bảo singleton pattern.

**Các hàm có sẵn:**

| Hàm | Mô tả |
|-----|-------|
| `getSupabaseClient()` | Trả về singleton Supabase client (dùng cho mọi thao tác) |
| `createEphemeralSupabaseClient()` | Client tạm thời, không persist session (dùng khi verify password) |

---

### 2️⃣ `services/` - Data Access Layer

Mỗi file service chịu trách nhiệm cho một nhóm entities:

#### `projectService.ts`

```typescript
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

// Types được định nghĩa trong service
export interface Project {
    id: string;
    name: string;
    description: string;
    deadline: string | null;
    ownerId: string;
    createdAt: string;
    template: 'kanban' | 'scrum';
    members: ProjectMember[];
    deletedAt?: string;
}

// Các hàm CRUD
export async function fetchProjects(userId: string): Promise<Project[]> { ... }
export async function createProject(...): Promise<Project> { ... }
export async function updateProject(...): Promise<Project> { ... }
export async function deleteProject(projectId: string): Promise<void> { ... }
export async function restoreProject(projectId: string): Promise<void> { ... }
export async function permanentlyDeleteProject(projectId: string): Promise<void> { ... }

// Quản lý members
export async function addProjectMember(...): Promise<void> { ... }
export async function removeProjectMember(...): Promise<void> { ... }

// Invitations & Join Requests
export async function sendInvitation(...): Promise<void> { ... }
export async function fetchInvitations(...): Promise<ProjectInvitation[]> { ... }
export async function respondToInvitation(...): Promise<void> { ... }
export async function createJoinRequest(...): Promise<void> { ... }
export async function fetchJoinRequests(...): Promise<JoinRequest[]> { ... }
export async function respondToJoinRequest(...): Promise<void> { ... }
```

#### `taskService.ts`

```typescript
export interface Task {
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
    parentTaskId?: string;   // Cho sub-tasks
    sprintId?: string;       // Gán vào sprint
    createdBy: string;
    createdAt: string;
    comments: Comment[];
    attachments: Attachment[];
    deletedAt?: string;
}

// CRUD
export async function fetchTasks(projectIds: string[]): Promise<Task[]> { ... }
export async function createTask(...): Promise<Task> { ... }
export async function updateTask(...): Promise<Task> { ... }
export async function deleteTask(taskId: string): Promise<void> { ... }

// Comments & Attachments
export async function addComment(...): Promise<Comment> { ... }
export async function addAttachment(...): Promise<Attachment> { ... }

// Task Proposals (cho workflow approve)
export async function createTaskProposal(...): Promise<TaskProposal> { ... }
export async function fetchTaskProposals(...): Promise<TaskProposal[]> { ... }
export async function approveProposal(...): Promise<Task> { ... }
export async function rejectProposal(...): Promise<void> { ... }
```

#### `sprintService.ts`

```typescript
export interface Sprint {
    id: string;
    name: string;
    goal: string;
    projectId: string;
    startDate: string;
    endDate?: string;
    status: 'active' | 'completed';
}

export async function fetchSprints(projectIds: string[]): Promise<Sprint[]> { ... }
export async function createSprint(...): Promise<Sprint> { ... }
export async function endSprint(sprintId: string): Promise<Sprint> { ... }
```

---

### 3️⃣ `hooks/` - Business Logic Layer

Hooks quản lý **state** và gọi **services**. Pattern chung:

```typescript
import { useState, useEffect, useCallback } from 'react';
import * as projectService from '../services/projectService';

export function useProjects({ user, onAddNotification }) {
    // State
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Fetch data khi user thay đổi
    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const data = await projectService.fetchProjects(user.id);
                setProjects(data);
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [user?.id]);
    
    // Handler functions
    const handleCreateProject = useCallback(async (project) => {
        const created = await projectService.createProject(project, user.id, ...);
        setProjects(prev => [...prev, created]);
        toast.success('Tạo dự án thành công!');
    }, [user]);
    
    const handleUpdateProject = useCallback(async (projectId, updates) => {
        const updated = await projectService.updateProject(projectId, updates);
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
    }, []);
    
    // Getter functions
    const getActiveProjects = useCallback(() => {
        return projects.filter(p => !p.deletedAt);
    }, [projects]);
    
    // Return all state and functions
    return {
        projects,
        isLoading,
        handleCreateProject,
        handleUpdateProject,
        getActiveProjects,
        // ...
    };
}
```

---

### 4️⃣ `contexts/AppContext.tsx` - Global State

Tập trung tất cả hooks vào một provider:

```typescript
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
// ...

export function AppProvider({ children }) {
    // Auth phải khởi tạo TRƯỚC (các hook khác depend vào user)
    const auth = useAuth();
    
    // Notifications (truyền vào các hook khác để gửi thông báo)
    const notifications = useNotifications({ userId: auth.user?.id });
    
    // Projects depend on user
    const projects = useProjects({ 
        user: auth.user, 
        onAddNotification: notifications.handleAddNotification 
    });
    
    // Tasks depend on user + projectIds
    const tasks = useTasks({ 
        user: auth.user, 
        projectIds: projects.projects.map(p => p.id),
        onAddNotification: notifications.handleAddNotification 
    });
    
    // Sprints depend on projectIds + tasks (để auto-update status)
    const sprints = useSprints({ 
        projectIds: projects.projects.map(p => p.id), 
        tasks: tasks.tasks, 
        setTasks: tasks.setTasks 
    });
    
    const value = { auth, projects, tasks, sprints, notifications, ... };
    
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook để consume context
export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
```

**Sử dụng trong components:**

```typescript
import { useApp } from '../contexts/AppContext';

function ProjectPage() {
    const { projects, tasks } = useApp();
    
    const activeProjects = projects.getActiveProjects();
    const projectTasks = tasks.getTasksByProject(selectedProjectId);
    
    return (
        <div>
            {activeProjects.map(project => (
                <ProjectCard 
                    key={project.id} 
                    project={project}
                    onUpdate={projects.handleUpdateProject}
                />
            ))}
        </div>
    );
}
```

---

### 5️⃣ `types/supabase.ts` - Database Types

File này được **auto-generate** từ Supabase CLI:

```bash
# Regenerate types khi schema thay đổi
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/supabase.ts
```

Cách sử dụng trong services:

```typescript
import type { Database } from '../types/supabase';

// Extract types từ Database
type TaskRow = Database['public']['Tables']['tasks']['Row'];      // SELECT result
type TaskInsert = Database['public']['Tables']['tasks']['Insert']; // INSERT data
type TaskUpdate = Database['public']['Tables']['tasks']['Update']; // UPDATE data

// Sử dụng
const insertData: TaskInsert = {
    title: 'New Task',
    project_id: '...',
    // ...
};
```

---

## Hướng dẫn thêm tính năng mới

### Ví dụ: Thêm tính năng "Labels" 🏷️

#### Bước 1: Tạo service file

📁 `src/services/labelService.ts`

```typescript
/**
 * Label Service - Supabase CRUD operations for labels
 */
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

type LabelRow = Database['public']['Tables']['labels']['Row'];

export interface Label {
    id: string;
    name: string;
    color: string;
    projectId: string;
}

// Transform DB row to app model
function transformLabel(row: LabelRow): Label {
    return {
        id: row.id,
        name: row.name,
        color: row.color,
        projectId: row.project_id || '',
    };
}

// Fetch labels for a project
export async function fetchLabels(projectId: string): Promise<Label[]> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('project_id', projectId);
    
    if (error) throw error;
    return (data || []).map(transformLabel);
}

// Create a new label
export async function createLabel(
    label: Omit<Label, 'id'>
): Promise<Label> {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
        .from('labels')
        .insert({
            name: label.name,
            color: label.color,
            project_id: label.projectId,
        })
        .select()
        .single();
    
    if (error) throw error;
    return transformLabel(data);
}

// Update a label
export async function updateLabel(
    labelId: string,
    updates: Partial<Label>
): Promise<Label> {
    const supabase = getSupabaseClient();
    
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.color !== undefined) updateData.color = updates.color;
    
    const { data, error } = await supabase
        .from('labels')
        .update(updateData)
        .eq('id', labelId)
        .select()
        .single();
    
    if (error) throw error;
    return transformLabel(data);
}

// Delete a label
export async function deleteLabel(labelId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', labelId);
    
    if (error) throw error;
}
```

#### Bước 2: Export trong `services/index.ts`

```typescript
export * as labelService from './labelService';
export type { Label } from './labelService';
```

#### Bước 3: Tạo hook

📁 `src/hooks/useLabels.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import * as labelService from '../services/labelService';

export type { Label } from '../services/labelService';

interface UseLabelsProps {
    projectId?: string;
}

export function useLabels({ projectId }: UseLabelsProps) {
    const [labels, setLabels] = useState<labelService.Label[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Fetch labels when projectId changes
    useEffect(() => {
        async function fetchData() {
            if (!projectId) {
                setLabels([]);
                return;
            }
            
            setIsLoading(true);
            try {
                const data = await labelService.fetchLabels(projectId);
                setLabels(data);
            } catch (error) {
                console.error('Failed to fetch labels:', error);
                toast.error('Không thể tải labels');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [projectId]);
    
    const handleCreateLabel = useCallback(async (
        label: Omit<labelService.Label, 'id'>
    ) => {
        try {
            const created = await labelService.createLabel(label);
            setLabels(prev => [...prev, created]);
            toast.success('Tạo label thành công!');
            return created;
        } catch (error) {
            toast.error('Không thể tạo label');
            throw error;
        }
    }, []);
    
    const handleUpdateLabel = useCallback(async (
        labelId: string,
        updates: Partial<labelService.Label>
    ) => {
        try {
            const updated = await labelService.updateLabel(labelId, updates);
            setLabels(prev => prev.map(l => l.id === labelId ? updated : l));
            toast.success('Cập nhật label thành công!');
            return updated;
        } catch (error) {
            toast.error('Không thể cập nhật label');
            throw error;
        }
    }, []);
    
    const handleDeleteLabel = useCallback(async (labelId: string) => {
        try {
            await labelService.deleteLabel(labelId);
            setLabels(prev => prev.filter(l => l.id !== labelId));
            toast.success('Xóa label thành công!');
        } catch (error) {
            toast.error('Không thể xóa label');
            throw error;
        }
    }, []);
    
    return {
        labels,
        isLoading,
        handleCreateLabel,
        handleUpdateLabel,
        handleDeleteLabel,
    };
}
```

#### Bước 4: Export trong `hooks/index.ts`

```typescript
export { useLabels, type Label } from './useLabels';
```

#### Bước 5 (Tùy chọn): Thêm vào AppContext nếu cần global state

```typescript
// Trong AppContext.tsx
const labels = useLabels({ projectId: selectedProjectId });

const value = {
    // ...existing
    labels,
};
```

---

## Hướng dẫn sửa code có sẵn

### Cheat Sheet: Cần sửa gì → Sửa ở đâu

| Tình huống | File cần sửa |
|------------|--------------|
| Thay đổi cách query Supabase | `services/*.ts` |
| Thêm field mới cho entity | 1. `types/supabase.ts` (regenerate), 2. `services/*.ts` (transform function) |
| Thay đổi business logic | `hooks/use*.ts` |
| Thêm handler mới | `hooks/use*.ts` → return thêm handler |
| Thay đổi UI/Component | `components/*.tsx` |
| Thay đổi auth flow | `hooks/useSupabaseAuth.ts` |
| Thêm toast/notification | Trong hook handler functions |

### Ví dụ: Thêm field `priority` cho Sprint

1. **Chạy regenerate types** (nếu đã thêm column trong Supabase):
   ```bash
   npx supabase gen types typescript --project-id <ID> > src/types/supabase.ts
   ```

2. **Cập nhật interface trong service:**
   ```typescript
   // services/sprintService.ts
   export interface Sprint {
       // ...existing
       priority: 'low' | 'medium' | 'high';  // ← thêm
   }
   ```

3. **Cập nhật transform function:**
   ```typescript
   function transformSprint(row: SprintRow): Sprint {
       return {
           // ...existing
           priority: row.priority as 'low' | 'medium' | 'high' || 'medium',
       };
   }
   ```

4. **Cập nhật create/update functions:**
   ```typescript
   export async function createSprint(...) {
       const insertData: SprintInsert = {
           // ...existing
           priority: sprint.priority || 'medium',
       };
   }
   ```

---

## Best Practices

### ✅ DO (Nên làm)

1. **Luôn dùng `getSupabaseClient()`**
   ```typescript
   const supabase = getSupabaseClient();
   ```

2. **Luôn handle errors trong hooks**
   ```typescript
   try {
       const data = await service.fetchData();
       setState(data);
   } catch (error) {
       console.error('Error:', error);
       toast.error('Đã xảy ra lỗi');
   }
   ```

3. **Dùng `useCallback` cho handler functions**
   ```typescript
   const handleCreate = useCallback(async (data) => {
       // ...
   }, [dependencies]);
   ```

4. **Transform data giữa DB format và App format**
   ```typescript
   // DB: snake_case → App: camelCase
   function transformTask(row: TaskRow): Task {
       return {
           projectId: row.project_id,  // transform
           createdAt: row.created_at,
       };
   }
   ```

5. **Export types từ services**
   ```typescript
   // service
   export interface Task { ... }
   
   // hook
   export type { Task } from '../services/taskService';
   ```

### ❌ DON'T (Không nên làm)

1. **Không gọi Supabase trực tiếp trong components**
   ```typescript
   // ❌ BAD
   function TaskList() {
       const supabase = getSupabaseClient();
       const data = await supabase.from('tasks').select('*');
   }
   
   // ✅ GOOD
   function TaskList() {
       const { tasks } = useApp();
   }
   ```

2. **Không tạo Supabase client mới**
   ```typescript
   // ❌ BAD
   import { createClient } from '@supabase/supabase-js';
   const supabase = createClient(url, key);
   
   // ✅ GOOD
   import { getSupabaseClient } from '../lib/supabase-client';
   const supabase = getSupabaseClient();
   ```

3. **Không lưu data vào localStorage**
   ```typescript
   // ❌ BAD (legacy code)
   localStorage.setItem('projects', JSON.stringify(projects));
   
   // ✅ GOOD - Data được persist trên Supabase
   await projectService.updateProject(id, updates);
   ```

4. **Không hardcode Supabase credentials**
   ```typescript
   // ❌ BAD
   const supabase = createClient('https://xxx.supabase.co', 'public-key');
   
   // ✅ GOOD - Dùng environment variables
   // .env file: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   ```

---

## Troubleshooting

### Error: "Environment variable is required but was not provided"

**Nguyên nhân:** Thiếu file `.env` hoặc thiếu biến môi trường

**Giải pháp:**
```bash
# Copy file .env.example
cp .env.example .env

# Điền thông tin Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### Error: "Cannot read property 'from' of null"

**Nguyên nhân:** Supabase client chưa được khởi tạo

**Giải pháp:** Đảm bảo gọi `getSupabaseClient()` thay vì dùng client trực tiếp

---

### Error: "Row Level Security policy violated"

**Nguyên nhân:** User không có quyền truy cập data

**Giải pháp:**
1. Kiểm tra user đã đăng nhập chưa
2. Kiểm tra RLS policies trong Supabase Dashboard
3. Đảm bảo user là member của project

---

### Data không refresh sau khi thao tác

**Giải pháp:** Kiểm tra có update local state sau khi gọi service không

```typescript
// ✅ Correct pattern
const handleUpdate = async (id, updates) => {
    const updated = await service.update(id, updates);
    setItems(prev => prev.map(item => item.id === id ? updated : item));  // ← Update state
};
```

---

## Liên hệ

Nếu có thắc mắc, vui lòng liên hệ:
- Xem thêm: [`hooks/README.md`](../hooks/README.md) - Tài liệu chi tiết về hooks
- Xem thêm: [`dbml/`](../dbml/) - Database schema

---

*📝 Tài liệu này được tạo để hỗ trợ team trong quá trình migrate từ localStorage sang Supabase.*
