# Integration Testing Documentation - Planora

## Tổng quan

Integration tests kiểm tra cách các components và modules hoạt động **cùng nhau**. Khác với unit tests (test từng đơn vị riêng lẻ), integration tests đảm bảo các phần của ứng dụng tích hợp đúng cách.

## Cấu trúc thư mục

```
frontend/src/test/integration/
├── forms.integration.test.ts     # Form components integration
├── project.integration.test.ts   # Project views integration
└── admin.integration.test.ts     # Admin & management integration
```

## Chạy Tests

```bash
# Chạy tất cả tests (unit + integration)
pnpm test run

# Chạy chỉ integration tests
pnpm test run src/test/integration
```

## Integration Test Files

### 1. forms.integration.test.ts (32 tests)

#### CreateTaskDialog Integration
| Test Case | Mô tả |
|-----------|-------|
| Form rendering | Render all required form fields |
| Initial values | Correct default values |
| Title validation | Require non-empty title |
| Priority/Status selection | All options available |
| Assignee selection | Multiple assignees, add/remove |
| Due date selection | Accept valid dates |
| Form submission | Correct data structure |
| Story points | Only for user-story type |

#### LoginPage Integration
| Test Case | Mô tả |
|-----------|-------|
| Email validation | Validate email format |
| Password validation | Minimum 6 characters |
| Loading state | Handle login process |
| Error handling | Display error messages |
| Navigation | Links to register, forgot password |

#### RegisterPage Integration
| Test Case | Mô tả |
|-----------|-------|
| Required fields | name, email, password, confirmPassword |
| Password confirmation | Match passwords |
| Registration data | Prepare correct data |

---

### 2. project.integration.test.ts (45 tests)

#### ProjectPage Integration
| Test Case | Mô tả |
|-----------|-------|
| Tab navigation | board, members, charts, history, settings |
| Default tab | Default to board |
| Tab switching | Allow tab changes |
| Permission-based tabs | Hide settings for non-managers |
| Board view selection | Kanban vs Scrum based on template |
| Project header | Display name, description, deadline |
| Role badge | Show user role correctly |

#### KanbanView Integration
| Test Case | Mô tả |
|-----------|-------|
| Column rendering | 4 status columns |
| Task count per column | Count tasks correctly |
| Drag and drop | Update status on drop |
| Task card display | Title, priority, assignees, due date |
| Overdue highlighting | Highlight overdue tasks |

#### ScrumView Integration
| Test Case | Mô tả |
|-----------|-------|
| Sprint display | Show current active sprint |
| Sprint goal | Display sprint goal |
| Sprint progress | Calculate completion percentage |
| Backlog management | Separate sprint tasks from backlog |
| Sprint actions | Start/end sprint (managers only) |

#### ProjectCharts Integration
| Test Case | Mô tả |
|-----------|-------|
| Statistics cards | Total, completed, overdue tasks |
| Chart data preparation | Status and priority charts |
| Export button | Excel and PDF options |

---

### 3. admin.integration.test.ts (29 tests)

#### Admin Dashboard Integration
| Test Case | Mô tả |
|-----------|-------|
| Dashboard sections | All sections present |
| System stats | Users, projects, tasks counts |
| Activity logs | Format time, action labels |
| Charts data | Sort statuses, calculate heights |
| User management | List, filter by role |

#### ActivityTimeline Integration
| Test Case | Mô tả |
|-----------|-------|
| Chronological order | Sort by date descending |
| User avatars | Display initials |
| Action icons | Map actions to icons |
| Status change | Display old → new status |
| Refresh | Reload activity list |
| Empty state | Show message when no activities |

#### ExportReportDialog Integration
| Test Case | Mô tả |
|-----------|-------|
| Export options | Excel and PDF |
| Loading state | Show during export |
| Error handling | Display error messages |
| File naming | Correct filename format |

#### ProjectMembers Integration
| Test Case | Mô tả |
|-----------|-------|
| Member list | Display all members |
| Sort order | Manager first |
| Member actions | Add/remove members |
| Role change | Update member roles |
| Last manager | Cannot remove last manager |

## Kết quả Test (12/01/2026)

```
Integration Test Files: 3 passed
Integration Tests: 106 passed
```

## Best Practices cho Integration Tests

1. **Test user flows**: Focus vào real user interactions
2. **Don't mock internal modules**: Chỉ mock external dependencies (API, DB)
3. **Test state changes**: Verify UI updates after actions
4. **Test permissions**: Verify role-based access control
5. **Test error scenarios**: Handle errors gracefully

## Thêm Integration Tests Mới

1. Tạo file trong `src/test/integration/`
2. Naming convention: `*.integration.test.ts`
3. Focus on:
   - Component interactions
   - Data flow between components
   - State management
   - User permissions
   - Form submissions and validations

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ComponentName Integration', () => {
  describe('Feature Interaction', () => {
    it('should handle user action correctly', () => {
      // Setup
      const initialState = { ... }
      
      // Action
      const newState = handleAction(initialState, action)
      
      // Assert
      expect(newState).toMatchObject(expectedState)
    })
  })
})
```
