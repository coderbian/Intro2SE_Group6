# Intro2SE_Group6

## Project Overview

This repository contains the code and documentation for the Intro to Software Engineering Group 6 project. The project focuses on developing **Planora** - a user-friendly, efficient, and AI-powered project management tool that supports both Kanban and Scrum methodologies.

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

### State Management & Data Flow
- **React Hooks** - useState, useEffect, useRef for local state
- **localStorage** - Persistent data storage (users, projects, tasks)
- **Context API** (via React Router) - Routing state management

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

## Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin dashboard components
│   ├── auth/           # Login, Register, ForgotPassword
│   ├── dashboard/      # User dashboard
│   ├── kanban/         # Kanban board implementation
│   ├── layout/         # MainLayout, navigation
│   ├── profile/        # User profile management
│   ├── project/        # Project detail page
│   ├── projects/       # Project list view
│   ├── routes/         # Route guards (ProtectedRoute, AdminRoute)
│   ├── scrum/          # Scrum board implementation
│   ├── settings/       # App settings
│   ├── trash/          # Deleted items management
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── dbml/               # Database schema designs
├── styles/             # Global CSS
├── App.tsx             # Main app component with routing
├── main.tsx            # React entry point
└── index.html          # HTML template
```

## Run Locally

Project code is in the `src` folder. The instructions below are for anyone cloning the repository.

### Requirements
- **Node.js 18+** (recommended: Node 20 LTS)
- **pnpm** recommended (the project includes `pnpm-lock.yaml`)

### Install and Run (Recommended with pnpm)

```powershell
# From the repository root
cd ./src
pnpm install
pnpm dev
```

### Build and Preview

```powershell
# From the src folder
pnpm build
pnpm exec vite preview
```

### Alternative: Using npm

```powershell
# From the repository root
cd ./src
npm install
npm run dev
```

### Clean Install (Start Fresh)

```powershell
# From the repository root
cd ./src
Remove-Item -Recurse -Force node_modules
pnpm install
pnpm dev
```

### Key Dependencies to Install

All dependencies are defined in `package.json` and will be installed automatically. Major libraries include:

**Core:**
- `react@18.3.1`, `react-dom@18.3.1`
- `react-router-dom@7.11.0`
- `typescript@5.x`

**UI & Styling:**
- `tailwindcss@4.1.17`
- `@radix-ui/*` (multiple packages)
- `lucide-react@0.454.0`
- `next-themes@0.4.6`

**Utilities:**
- `sonner@2.0.3` (toast notifications)
- `recharts@2.15.2` (charts)
- `react-hook-form@7.55.0` (forms)
- `class-variance-authority@0.7.1`, `clsx@2.1.1`, `tailwind-merge@2.5.5`

**Dev Tools:**
- `vite@6.3.5`
- `@vitejs/plugin-react-swc@3.10.2`
- `@types/react@19.2.2`, `@types/react-dom@19.2.2`

## Features

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

## Notes
- Run all commands from the `src` directory (where `package.json` lives)
- Keep `pnpm-lock.yaml` to reproduce exact dependency versions
