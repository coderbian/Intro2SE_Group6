# Admin Components

This folder contains all admin-related components for the Planora project management system.

## Components

- **UserManagement.tsx** (AdminDashboard) - Quản lý người dùng
- **SystemMonitoring.tsx** - Giám sát hệ thống (Dashboard, CPU/RAM, Activity logs)
- **RoleManagement.tsx** - Quản lý vai trò và phân quyền
- **SystemSettings.tsx** - Cấu hình hệ thống (Email, Limits)
- **BackupRestore.tsx** - Sao lưu và phục hồi dữ liệu

## Usage

```tsx
import { AdminDashboard, SystemMonitoring, RoleManagement, SystemSettings, BackupRestore } from '@/src/components/admin'
```

## Navigation Props

All components accept:
- `adminEmail?: string` - Email của admin đang đăng nhập
- `onNavigate: (page) => void` - Navigation handler
- `onLogout?: () => void` - Logout handler
