# Planora - Project Management System

## Project Overview

This repository contains the code and documentation for the Intro to Software Engineering Group 6 project. The project focuses on developing **Planora** - a user-friendly, efficient, and AI-powered project management tool that supports both Kanban and Scrum methodologies.

## 📁 Project Structure

```
Intro2SE_Group6/
├── frontend/              # React + Vite frontend application
│   ├── src/
│   │   ├── components/    # React UI components
│   │   │   ├── admin/     # Admin dashboard
│   │   │   ├── auth/      # Authentication pages
│   │   │   ├── chat/      # AI chat assistant
│   │   │   ├── dashboard/ # User dashboard
│   │   │   ├── kanban/    # Kanban board
│   │   │   ├── layout/    # Main layout
│   │   │   ├── project/   # Project details
│   │   │   ├── scrum/     # Scrum board
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   └── ...
│   │   ├── contexts/      # React Context (Auth, App)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Supabase client, utilities
│   │   ├── routes/        # Route definitions
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Helper functions
│   ├── .env               # Environment variables
│   ├── package.json
│   └── vite.config.ts
│
├── supabase/              # Supabase Edge Functions (AI services)
│   └── functions/
│       ├── chat/              # AI chat assistant
│       ├── enhance-description/ # Task description enhancement
│       └── estimate-time/     # Time estimation
│
├── docs/                  # Documentation
│   ├── analysis-and-design/
│   ├── management/
│   ├── requirements/
│   └── test/
│
└── pa/                    # Project assignments
```

## Tech Stack

### Frontend Framework
- **React 18.3.1** - Modern UI library with functional components and hooks
- **TypeScript 5.x** - Type-safe JavaScript for better development experience
- **Vite 6.3.5** - Lightning-fast build tool and dev server

### Routing & Navigation
- **React Router DOM 7.11.0** - Client-side routing with URL-based navigation
- Protected routes with authentication guards
- Admin routes with role-based access control

### UI Components & Styling
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
- **shadcn/ui** - Re-usable component library built on Radix UI
- **Lucide React** - Beautiful icon library
- **next-themes** - Dark mode support

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Email, OAuth)
  - Edge Functions (AI services)
  - Row Level Security (RLS)
  - Real-time subscriptions

### State Management & Data Flow
- **React Hooks** - useState, useEffect, useRef for local state
- **Context API** - AppContext, AuthContext for global state
- **Custom Hooks** - useAuth, useProjects, useTasks, useSprints, useNotifications

### UI Features
- **Sonner** - Toast notifications
- **React Day Picker** - Date selection
- **Recharts** - Data visualization and charts
- **Embla Carousel** - Touch-friendly carousels
- **React Resizable Panels** - Draggable panel layouts
- **Vaul** - Drawer components

### Form Handling
- **React Hook Form 7.55.0** - Performant form validation
- **Input OTP** - One-time password input

### Development Tools
- **@vitejs/plugin-react-swc** - Fast React refresh with SWC compiler
- **PostCSS & Autoprefixer** - CSS processing
- **ESLint & Prettier** - Code quality and formatting
- **tsx** - TypeScript execution for Node.js
- **Jest** - Testing framework

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (recommended: Node 20 LTS)
- **pnpm** (recommended) or npm
- **Supabase account** for database and authentication

### ⚠️ PowerShell Users (Windows)
If you encounter script execution errors, run this in each new terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```
Frontend runs at: **http://localhost:3000**

### Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠️ Available Scripts

### Frontend (`cd frontend`)
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |

## ✨ Features

### User Features
- 🔐 User authentication (register, login, password recovery)
- 📊 Dashboard with project overview and statistics
- 📋 Kanban board for visual task management
- 🏃 Scrum board with sprint planning
- 👥 Project member management and invitations
- 🗑️ Trash system for deleted projects/tasks
- 🔔 Real-time notifications
- ⚙️ User settings and profile customization
- 🌙 Dark mode support

### Admin Features
- 👨‍💼 User management dashboard
- 🛡️ Role-based access control
- 📈 System monitoring and analytics
- ⚙️ System settings configuration
- 💾 Backup and restore functionality

## 📚 Documentation

- [Developer Guide](DEVELOPER.md)
- [Supabase Migration](SUPABASE_MIGRATION.md)
- [Project Documentation](docs/)

## 📄 License

MIT License
