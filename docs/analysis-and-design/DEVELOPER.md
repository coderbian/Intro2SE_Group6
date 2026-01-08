# Planora - Developer Documentation

## Project Overview

**Planora** is a modern, AI-powered project management application designed to streamline team collaboration through support for both **Kanban** and **Scrum** methodologies. The application provides an intuitive interface for managing projects, tasks, sprints, and team members with real-time updates and notifications.

### Architecture

Planora is transitioning from a traditional 3-tier architecture to a modern **Backend-as-a-Service (BaaS)** approach:

- **Frontend**: React 18 with Vite, TypeScript, and Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time subscriptions, Storage, Edge Functions)
- **Deployment**: Client-side rendering with API calls to Supabase services

This architecture shift enables:
- Faster development cycles with built-in authentication and database management
- Real-time collaborative features out of the box
- Scalable infrastructure without managing servers
- Reduced operational complexity

---

## Tech Stack

### Frontend Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 18.3.1 | UI library for component-based development |
| **Build Tool** | Vite 6.3.5 | Fast development server and optimized production builds |
| **Language** | TypeScript 5.x | Type-safe JavaScript with enhanced developer experience |
| **Styling** | Tailwind CSS 4.1.17 | Utility-first CSS framework |
| **UI Components** | Radix UI | Accessible, unstyled component primitives |
| **Icons** | Lucide React | Modern icon library |
| **Forms** | React Hook Form 7.55.0 | Performant form validation and management |
| **State Management** | Custom Hooks | Modular state management using React hooks |
| **Theming** | next-themes 0.4.6 | Dark/light mode support |
| **Notifications** | Sonner 2.0.3 | Toast notifications |
| **Charts** | Recharts 2.15.2 | Data visualization |
| **Drag & Drop** | Custom implementation | Kanban board interactions |

### Backend & Infrastructure

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Database** | Supabase (PostgreSQL) | Relational database with real-time capabilities |
| **Authentication** | Supabase Auth | User authentication and authorization |
| **Storage** | Supabase Storage | File and media storage |
| **Real-time** | Supabase Realtime | WebSocket-based real-time subscriptions |
| **Edge Functions** | Supabase Edge Functions | Serverless functions for backend logic |

### Development Tools

- **Package Manager**: pnpm (recommended) or npm
- **CSS Processing**: PostCSS, Autoprefixer
- **React Compiler**: SWC for fast compilation
- **Linting & Formatting**: (To be configured)

---

## Project Structure

```
src/
├── app/                      # App-level configurations
│   └── admin/                # Admin-specific routing/configs
├── components/               # React components organized by feature
│   ├── admin/                # Admin dashboard components
│   │   ├── BackupRestore.tsx
│   │   ├── RoleManagement.tsx
│   │   ├── SystemMonitoring.tsx
│   │   ├── SystemSettings.tsx
│   │   └── UserManagement.tsx
│   ├── auth/                 # Authentication pages
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── dashboard/            # Main dashboard view
│   ├── kanban/               # Kanban board components
│   ├── scrum/                # Scrum board components
│   ├── project/              # Project-specific components
│   │   ├── KanbanView.tsx
│   │   ├── ScrumView.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDialog.tsx
│   │   └── ProjectSettings.tsx
│   ├── layout/               # Layout components (MainLayout)
│   ├── profile/              # User profile pages
│   ├── settings/             # Application settings
│   ├── notifications/        # Notification components
│   ├── trash/                # Trash/recycle bin
│   └── ui/                   # Reusable UI components (shadcn/ui)
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts            # Authentication logic
│   ├── useProjects.ts        # Project management
│   ├── useTasks.ts           # Task management
│   ├── useSprints.ts         # Sprint management (Scrum)
│   ├── useNotifications.ts   # Notification system
│   └── useSettings.ts        # App settings
├── lib/                      # Utility libraries
│   └── utils.ts              # Common utility functions
├── utils/                    # Business logic utilities
│   └── permissions.ts        # Permission/role checking
├── styles/                   # Global styles
│   └── globals.css
├── public/                   # Static assets
├── guidelines/               # Development guidelines
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
├── index.html                # HTML template
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── postcss.config.mjs        # PostCSS configuration
└── components.json           # shadcn/ui configuration
```

### Directory Responsibilities

#### `/components`
Organized by feature domains (admin, auth, kanban, etc.). Each subdirectory contains related components following a modular architecture. The `ui/` subdirectory houses reusable, generic UI components based on Radix UI and styled with Tailwind CSS.

#### `/hooks`
Custom React hooks that encapsulate business logic and state management. These hooks provide a clean separation of concerns by extracting stateful logic from components. See [hooks/README.md](src/hooks/README.md) for detailed API documentation.

#### `/lib`
Shared utility functions and helpers used across the application, such as class name merging (`cn` utility) and other common operations.

#### `/utils`
Business-specific utilities like permission checking, validation logic, and domain-specific helpers.

#### `/styles`
Global CSS files and Tailwind configuration.

### Supabase Integration Structure

**Recommended**: Create the following structure for Supabase-related code:

```
src/
├── services/
│   └── supabase/
│       ├── client.ts          # Supabase client initialization
│       ├── auth.ts            # Authentication service
│       ├── projects.ts        # Project CRUD operations
│       ├── tasks.ts           # Task CRUD operations
│       ├── sprints.ts         # Sprint CRUD operations
│       ├── members.ts         # Team member operations
│       ├── notifications.ts   # Notification operations
│       ├── realtime.ts        # Real-time subscription handlers
│       └── types.ts           # Supabase-specific TypeScript types
```

Alternatively, you can use:

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── database.types.ts  # Auto-generated from Supabase CLI
│   │   └── queries/
│   │       ├── projects.ts
│   │       ├── tasks.ts
│   │       └── users.ts
```

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **Package Manager**: pnpm (recommended) or npm
- **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Intro2SE_Group6
   ```

2. **Navigate to the source directory**:
   ```bash
   cd src
   ```

3. **Install dependencies**:
   
   Using pnpm (recommended):
   ```bash
   pnpm install
   ```
   
   Using npm:
   ```bash
   npm install
   ```

### Environment Variables Setup

Create a `.env` file in the `src/` directory with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Additional Configuration
VITE_APP_NAME=Planora
VITE_ENABLE_ANALYTICS=false
```

**How to get Supabase credentials**:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** (for `VITE_SUPABASE_URL`)
5. Copy the **anon/public** key (for `VITE_SUPABASE_ANON_KEY`)

> **Security Note**: Never commit the `.env` file to version control. It should be listed in `.gitignore`.

---

## Development Workflow

### Running the Development Server

Start the local development server with hot module replacement:

```bash
# Using pnpm
pnpm dev

# Using npm
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Building for Production

Create an optimized production build:

```bash
# Using pnpm
pnpm build

# Using npm
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
# Using pnpm
pnpm exec vite preview

# Using npm
npx vite preview
```

### Clean Install

If you encounter dependency issues, perform a clean install:

```bash
# Remove node_modules and lock file
rm -rf node_modules pnpm-lock.yaml  # or package-lock.json for npm

# Reinstall dependencies
pnpm install  # or npm install
```

---

## Roadmap to Supabase Integration

This section outlines the planned migration from in-memory state management to Supabase backend services.

### Phase 1: Authentication

**Goal**: Replace the current mock authentication with Supabase Auth.

- [ ] Set up Supabase Auth configuration
- [ ] Implement email/password authentication
- [ ] Add social OAuth providers (Google, GitHub)
- [ ] Implement password reset functionality
- [ ] Add email verification
- [ ] Set up Row Level Security (RLS) policies
- [ ] Migrate `useAuth` hook to use Supabase Auth

**Files to modify**:
- `src/hooks/useAuth.ts`
- `src/components/auth/LoginPage.tsx`
- `src/components/auth/RegisterPage.tsx`
- `src/components/auth/ForgotPasswordPage.tsx`

### Phase 2: Database Schema & CRUD Operations

**Goal**: Design and implement the PostgreSQL database schema.

- [ ] Design database schema (Projects, Tasks, Sprints, Members, Notifications)
- [ ] Create database migrations in Supabase
- [ ] Implement Row Level Security (RLS) policies for multi-tenancy
- [ ] Set up foreign key relationships and constraints
- [ ] Create database functions for complex queries
- [ ] Implement project CRUD operations
- [ ] Implement task CRUD operations
- [ ] Implement sprint CRUD operations
- [ ] Implement member management operations
- [ ] Implement notification system

**Files to create**:
- `src/services/supabase/client.ts`
- `src/services/supabase/projects.ts`
- `src/services/supabase/tasks.ts`
- `src/services/supabase/sprints.ts`

**Files to modify**:
- `src/hooks/useProjects.ts`
- `src/hooks/useTasks.ts`
- `src/hooks/useSprints.ts`

### Phase 3: Real-time Updates

**Goal**: Implement real-time collaborative features using Supabase Realtime.

- [ ] Set up Supabase Realtime subscriptions
- [ ] Implement real-time Kanban board updates (task movements)
- [ ] Implement real-time Scrum board updates
- [ ] Add real-time notifications
- [ ] Implement presence indicators (who's viewing/editing)
- [ ] Add optimistic UI updates with conflict resolution
- [ ] Handle reconnection and sync logic

**Real-time Features**:
- Live task updates when team members move cards
- Instant notification delivery
- Real-time project member changes
- Live sprint progress updates

**Files to create**:
- `src/services/supabase/realtime.ts`

**Files to modify**:
- `src/components/kanban/KanbanBoard.tsx`
- `src/components/scrum/ScrumBoard.tsx`
- `src/hooks/useNotifications.ts`

### Phase 4: Storage & Media

**Goal**: Implement file uploads using Supabase Storage.

- [ ] Set up Supabase Storage buckets
- [ ] Implement avatar upload functionality
- [ ] Add file attachments to tasks
- [ ] Implement project file/document storage
- [ ] Add image optimization and thumbnails

### Phase 5: Advanced Features

**Goal**: Leverage Supabase Edge Functions for complex operations.

- [ ] Implement email notifications using Edge Functions
- [ ] Add AI-powered task suggestions (if applicable)
- [ ] Create automated reports generation
- [ ] Implement data export functionality
- [ ] Add webhooks for third-party integrations

---

## Code Style & Guidelines

- Follow the existing project structure and naming conventions
- Use TypeScript for type safety
- Write semantic, accessible HTML
- Keep components small and focused on single responsibilities
- Use custom hooks for shared logic
- Document complex logic with comments
- See `src/guidelines/Guidelines.md` for detailed coding standards

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Test your changes thoroughly
4. Submit a pull request with a clear description of changes

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/primitives)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

## Support & Contact

For questions or issues, please refer to:
- Project documentation in `/docs`
- Hooks documentation in `/src/hooks/README.md`
- Team lead or project maintainer

---

**Last Updated**: January 2026  
**Version**: 0.1.0
