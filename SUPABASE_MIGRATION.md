# Planora: LocalStorage → Supabase Migration Plan

> **Generated:** 2026-01-02  
> **Status:** Ready for Team Review  
> **Supabase Project:** Already Created (existing database schema + types)

---

## 📋 Prerequisites

Before starting any migration work, **every team member** must complete these steps:

### 1. Verify Dependencies
```bash
# Supabase JS is already installed. Verify with:
cd src && pnpm list @supabase/supabase-js
```

### 2. Environment Setup
Ensure `.env` contains valid credentials (already exists at `src/.env`):
```env
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Database Schema Reference
- **TypeScript Types:** [`src/types/supabase.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/types/supabase.ts)
- **Supabase Client:** [`src/lib/supabase-client.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/lib/supabase-client.ts)

> [!IMPORTANT]
> The `getSupabaseClient()` function is already configured. Use this singleton in all hooks.

---

## 🔀 Git Branching Strategy

### Branch Naming Convention
```
feature/supabase-<phase>-<module>
```

**Examples:**
- `feature/supabase-phase1-settings`
- `feature/supabase-phase2-member-requests`
- `feature/supabase-phase3-tasks`
- `feature/supabase-phase4-sprints`

### Rules to Avoid Merge Conflicts

| Rule | Description |
|------|-------------|
| **One Hook = One Owner** | Each hook file is owned by ONE developer per phase |
| **No Cross-Hook Edits** | Never edit hooks outside your assigned module |
| **Context Updates Last** | `AppContext.tsx` changes are merged only after all hooks in a phase are complete |
| **Coordinate Types** | If adding new types to `types/supabase.ts`, notify the team in Slack/Discord |

---

## 📊 Current LocalStorage Usage Map

| localStorage Key | Hook File | Data Stored | Status |
|------------------|-----------|-------------|--------|
| `planora_admin` | `useSupabaseAuth.ts` | Admin flag | ✅ Already Supabase Auth |
| `planora_settings` | `useSettings.ts` | Theme, language, notifications | 🔴 Needs Migration |
| `planora_projects` | `useProjects.ts` | Projects array | 🔴 Needs Migration |
| `planora_invitations` | `useProjects.ts` | Project invitations | 🔴 Needs Migration |
| `planora_join_requests` | `useProjects.ts` | Join requests | 🔴 Needs Migration |
| `planora_tasks` | `useTasks.ts` | Tasks array | 🔴 Needs Migration |
| `planora_task_proposals` | `useTasks.ts` | Task proposals | 🔴 Needs Migration |
| `planora_sprints` | `useSprints.ts` | Sprints array | 🔴 Needs Migration |
| `planora_notifications` | `useNotifications.ts` | Notifications array | 🔴 Needs Migration |

---

## 🚀 Phase 1: Authentication + Settings/System Testing

**Goal:** Complete auth integration and migrate user preferences.  
**Branch:** `feature/supabase-phase1-settings`  
**Estimated Effort:** 1-2 days

### Implementation Matrix

| Task | Primary Files | Supabase API | Definition of Done |
|------|---------------|--------------|-------------------|
| Remove localStorage admin flag | [`src/hooks/useSupabaseAuth.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useSupabaseAuth.ts) (L249) | Use `supabase.auth.getUser()` metadata for admin role | Admin login works without localStorage |
| Remove localStorage from AdminRoutes | [`src/routes/AdminRoutes.tsx`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/routes/AdminRoutes.tsx) (L13) | Check user role via session | Route protection uses Supabase session |
| Migrate Settings hook | [`src/hooks/useSettings.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useSettings.ts) | `supabase.from('user_preferences').upsert()` | Settings persist across devices |
| Remove localStorage from LoginPage | [`src/components/auth/LoginPage.tsx`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/components/auth/LoginPage.tsx) (L92-124) | Read settings from `user_preferences` table | Login flow uses remote settings |

### Supabase Tables Required
```sql
-- user_preferences (already in schema)
-- Columns: user_id, notifications (jsonb), display (jsonb)
```

### Testing Checklist
- [x] User can login and settings load from Supabase
- [x] Theme preference persists after logout → login on different browser
- [ ] Admin login works without localStorage dependency
- [x] New user gets default settings created automatically

---

## 👥 Phase 2: Member Management & Discovery + View Request Testing

**Goal:** Migrate project membership, invitations, and join requests.  
**Branch:** `feature/supabase-phase2-projects`  
**Estimated Effort:** 2-3 days

### Implementation Matrix

| Task | Primary Files | Supabase API | Definition of Done |
|------|---------------|--------------|-------------------|
| Migrate Projects hook - Core | [`src/hooks/useProjects.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useProjects.ts) | `supabase.from('projects').select()` | Projects fetched from DB on mount |
| Migrate Project Members | [`src/hooks/useProjects.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useProjects.ts) (L59-69) | `supabase.from('project_members').insert()` | Members stored in `project_members` table |
| Migrate Invitations | [`src/hooks/useProjects.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useProjects.ts) | `supabase.from('join_requests').insert()` with `request_type: 'invite'` | Invitations use `join_requests` table |
| Migrate Join Requests | [`src/hooks/useProjects.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useProjects.ts) | `supabase.from('join_requests').insert()` with `request_type: 'request'` | Requests tracked in DB |
| Update ProjectSelector | [`src/components/ProjectSelector.tsx`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/components/ProjectSelector.tsx) | Use hook data (no direct changes) | ProjectSelector shows DB projects |

### Supabase Tables Required
```sql
-- projects, project_members, join_requests (all in schema)
```

### File Boundary Assignments
```
Developer A: useProjects.ts (L1-L140) - Core project CRUD
Developer B: useProjects.ts (L140-269) - Invitations/Join Requests
```

### Testing Checklist
- [ ] Create project → appears in Supabase `projects` table
- [ ] Add member → `project_members` row created
- [ ] Send invitation → `join_requests` row with type 'invite'
- [ ] Accept invitation → user added to `project_members`
- [ ] Soft delete → `deleted_at` timestamp set (not hard delete)

---

## ✅ Phase 3: Task Management & Notification Testing

**Goal:** Migrate tasks, comments, attachments, proposals, and notifications.  
**Branch:** `feature/supabase-phase3-tasks`  
**Estimated Effort:** 3-4 days (largest module)

### Implementation Matrix

| Task | Primary Files | Supabase API | Definition of Done |
|------|---------------|--------------|-------------------|
| Migrate Tasks hook - Core | [`src/hooks/useTasks.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useTasks.ts) (L62-74) | `supabase.from('tasks').select('*, task_assignees(*), comments(*), attachments(*)')` | Tasks fetch with relations |
| Migrate Task Assignees | [`src/hooks/useTasks.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useTasks.ts) | `supabase.from('task_assignees').insert()` | Assignees in separate table |
| Migrate Comments | [`src/hooks/useTasks.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useTasks.ts) (L168-182) | `supabase.from('comments').insert()` | Comments stored in DB |
| Migrate Attachments | [`src/hooks/useTasks.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useTasks.ts) (L184-200) | `supabase.from('attachments').insert()` + `supabase.storage.upload()` | Files in Supabase Storage |
| Migrate Task Proposals | [`src/hooks/useTasks.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useTasks.ts) (L202-237) | Use `tasks` table with `status: 'proposed'` or new `task_proposals` table | Proposals tracked in DB |
| Migrate Notifications | [`src/hooks/useNotifications.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useNotifications.ts) | `supabase.from('notifications').insert()` | Real-time notifications |

### Supabase Tables Required
```sql
-- tasks, task_assignees, task_labels, comments, attachments, notifications
```

### Real-time Subscription (Optional Enhancement)
```typescript
// In useNotifications.ts
supabase
  .channel('notifications')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, payload => handleNewNotification(payload.new))
  .subscribe()
```

### Testing Checklist
- [ ] Create task → row in `tasks` table
- [ ] Assign user → row in `task_assignees`
- [ ] Add comment → row in `comments` with correct `task_id`
- [ ] Upload attachment → file in Storage + row in `attachments`
- [ ] Mark notification read → `is_read: true` in DB
- [ ] Delete task (soft) → `deleted_at` timestamp set

---

## 📈 Phase 4: Scrum-Sprint & Project Management + AI Testing

**Goal:** Migrate sprints, boards, and AI interaction logging.  
**Branch:** `feature/supabase-phase4-sprints`  
**Estimated Effort:** 2 days

### Implementation Matrix

| Task | Primary Files | Supabase API | Definition of Done |
|------|---------------|--------------|-------------------|
| Migrate Sprints hook | [`src/hooks/useSprints.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useSprints.ts) | `supabase.from('sprints').insert()` | Sprints stored in DB |
| Link Tasks to Sprints | [`src/hooks/useSprints.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useSprints.ts) (L40-45) | `supabase.from('tasks').update({ sprint_id })` | Tasks reference sprint via FK |
| End Sprint Logic | [`src/hooks/useSprints.ts`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/hooks/useSprints.ts) (L51-96) | Batch update tasks + update sprint status | Incomplete tasks moved to backlog |
| AI Interactions (if applicable) | New hook or service | `supabase.from('ai_interactions').insert()` | AI usage logged for analytics |
| Activity Logging | Service layer | `supabase.from('activity_logs').insert()` | Audit trail for changes |

### Supabase Tables Required
```sql
-- sprints, boards, lists, ai_interactions, activity_logs
```

### Testing Checklist
- [ ] Create sprint → row in `sprints` table
- [ ] Add tasks to sprint → `sprint_id` set on tasks
- [ ] End sprint → incomplete tasks have `sprint_id: null` and `status: 'backlog'`
- [ ] Sprint history shows completed sprints

---

## 🔧 AppContext.tsx Integration Strategy

> [!WARNING]
> **DO NOT modify `AppContext.tsx` until all hooks in a phase are complete and tested.**

### Integration Order
1. ✅ Phase 1 complete → Merge settings hook integration
2. ✅ Phase 2 complete → Merge projects hook integration  
3. ✅ Phase 3 complete → Merge tasks/notifications hook integration
4. ✅ Phase 4 complete → Merge sprints hook integration

### AppContext File Reference
- **File:** [`src/contexts/AppContext.tsx`](file:///Users/coderbian/Developer/University/Intro2SE_Group6/src/contexts/AppContext.tsx)
- **Key Lines:** 85-103 (hook instantiation)

---

## 🧪 Testing Commands

```bash
# Run development server
cd src && pnpm dev

# Type checking
pnpm tsc --noEmit

# Regenerate Supabase types (if schema changes)
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

---

## 📁 File Ownership Quick Reference

| File | Phase | Owner | Notes |
|------|-------|-------|-------|
| `hooks/useSettings.ts` | 1 | - | Settings migration |
| `hooks/useSupabaseAuth.ts` | 1 | - | Remove localStorage admin |
| `routes/AdminRoutes.tsx` | 1 | - | Session-based admin check |
| `components/auth/LoginPage.tsx` | 1 | - | Remove localStorage reads |
| `hooks/useProjects.ts` | 2 | - | Full hook migration |
| `hooks/useTasks.ts` | 3 | - | Full hook migration |
| `hooks/useNotifications.ts` | 3 | - | Full hook migration |
| `hooks/useSprints.ts` | 4 | - | Full hook migration |
| `contexts/AppContext.tsx` | All | **Tech Lead** | Final integration only |

---

## ✅ Final Checklist Before Production

- [ ] All `localStorage` references removed (grep search: `localStorage`)
- [ ] RLS (Row Level Security) policies enabled on all tables
- [ ] Environment variables set in production (Vercel, etc.)
- [ ] Supabase types regenerated and committed
- [ ] All tests passing
- [ ] No console errors related to permissions
