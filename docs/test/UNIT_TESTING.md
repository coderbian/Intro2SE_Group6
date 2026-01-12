# Unit Testing Documentation - Planora

## Tổng quan

Dự án Planora sử dụng **Vitest** làm testing framework kết hợp với **React Testing Library** cho component testing. Unit tests kiểm tra từng đơn vị code riêng lẻ (functions, hooks, services).

## Cài đặt

Dependencies đã được cài đặt:
- `vitest` - Test runner
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM simulation
- `@vitest/coverage-v8` - Coverage reporting

## Cấu trúc thư mục

```
frontend/
├── vitest.config.ts          # Vitest configuration
├── src/test/
│   ├── setup.ts                    # Test setup & mocks
│   ├── exportService.test.ts       # Export service tests
│   ├── projectActivityService.test.ts  # Activity logging tests
│   ├── routes.test.ts              # Route protection tests
│   ├── taskUtils.test.ts           # Task utilities tests
│   ├── auth.test.ts                # Authentication tests
│   ├── useTasks.test.ts            # useTasks hook tests
│   ├── useSprintsAndProjects.test.ts   # Sprint & Project tests
│   └── adminService.test.ts        # Admin service tests
```

## Chạy Tests

```bash
# Chạy tests ở watch mode
pnpm test

# Chạy tests một lần (cho CI)
pnpm test run

# Chạy tests với coverage report
pnpm test:coverage
```

## Unit Test Files

### 1. exportService.test.ts (4 tests)
| Test Case | Mô tả |
|-----------|-------|
| removeDiacritics conversion | Chuyển đổi tiếng Việt có dấu sang không dấu |
| Status labels mapping | Kiểm tra mapping status labels |
| Priority labels mapping | Kiểm tra mapping priority labels |
| in_progress vs in-progress | Xử lý cả 2 format status |

### 2. projectActivityService.test.ts (5 tests)
| Test Case | Mô tả |
|-----------|-------|
| Task action labels | Labels cho các actions của task |
| Project action labels | Labels cho các actions của project |
| Member action labels | Labels cho các actions của member |
| Sprint action labels | Labels cho các actions của sprint |
| Unknown action fallback | Xử lý action/entity không xác định |

### 3. routes.test.ts (6 tests)
| Test Case | Mô tả |
|-----------|-------|
| AdminRoute - not authenticated | Redirect đến login khi chưa đăng nhập |
| AdminRoute - authenticated but not admin | Redirect đến 403 |
| AdminRoute - authenticated as admin | Cho phép truy cập |
| AdminRoute - role loading | Hiển thị loading state |
| ProtectedRoute - user null | Redirect đến login |
| ProtectedRoute - user exists | Cho phép truy cập |

### 4. taskUtils.test.ts (14 tests)
Tests cho task status, priority, type validation, date checks, và statistics calculation.

### 5. auth.test.ts (11 tests)
Tests cho email/password validation và role checking.

### 6. useTasks.test.ts (17 tests)
| Test Case | Mô tả |
|-----------|-------|
| Task data transformation | Chuyển đổi DB format sang app format |
| Task validation | Validate title, projectId |
| Task status updates | Cập nhật status, preserve fields |
| Parent task status logic | Tự động cập nhật status parent |
| Task deletion/restore | Soft delete và restore |
| Comment handling | Tạo comment, validate content |
| Attachment validation | Validate file size, extension |

### 7. useSprintsAndProjects.test.ts (27 tests)
| Test Case | Mô tả |
|-----------|-------|
| Sprint validation | Validate name, projectId |
| Sprint status management | Start/end sprint |
| Sprint date validation | Validate dates, calculate duration |
| Sprint task association | Gán tasks vào sprint |
| Project validation | Validate name, deadline, template |
| Project member management | Add/remove/update members |
| Project soft delete | Xóa mềm và restore |
| Project filtering | Filter by status, membership |

### 8. adminService.test.ts (16 tests)
| Test Case | Mô tả |
|-----------|-------|
| System statistics | Tính users, projects, tasks |
| Tasks by status | Đếm tasks theo status |
| Users by role | Đếm users theo role |
| Monthly statistics | Group data theo tháng |
| User management | Validate user data |
| Activity log formatting | Format activity logs |
| Completion rate | Tính tỷ lệ hoàn thành |
| Status ordering | Sắp xếp theo workflow |

## Kết quả Test (12/01/2026)

```
Unit Test Files: 8 passed
Unit Tests: 100 passed
```

## Mocking Strategy

### Supabase Client Mock
File `setup.ts` mock toàn bộ Supabase client để tránh gọi API thật:
- `supabase.auth` - Authentication methods
- `supabase.from()` - Database queries
- `supabase.storage` - File storage
- `supabase.channel()` - Realtime subscriptions

### Toast Notifications Mock
Mock `sonner` toast để không hiển thị notifications trong tests.

### UUID Mock
Mock `uuid.v4()` để trả về giá trị cố định, giúp tests deterministic.

## Coverage

Để xem coverage report:
```bash
pnpm test:coverage
```

Coverage sẽ được generate ở:
- Terminal output (text format)
- `coverage/` folder (HTML report)

## Best Practices

1. **Naming convention**: `*.test.ts` hoặc `*.spec.ts`
2. **Test isolation**: Mỗi test độc lập, không phụ thuộc state từ test khác
3. **Mock external dependencies**: Supabase, toast, uuid
4. **Descriptive test names**: Mô tả rõ ràng điều kiện và kết quả mong đợi
5. **Group related tests**: Sử dụng `describe()` blocks

## Thêm Tests Mới

1. Tạo file `.test.ts` trong `src/test/`
2. Import các utilities cần thiết:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
```
3. Viết tests theo pattern:
```typescript
describe('Feature Name', () => {
  describe('Specific Scenario', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = someFunction(input)
      
      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

## Xem thêm

- [Integration Testing](./INTEGRATION_TESTING.md) - Tests cho component interactions
