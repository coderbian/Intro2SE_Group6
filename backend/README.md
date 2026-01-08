# Planora Backend API

A complete Express.js backend API for the Planora project management application.

## 🚀 Features

- **Authentication**: JWT-based auth with Supabase, OAuth support (Google, GitHub, GitLab)
- **Projects**: Full project CRUD with member management, invitations, and soft delete
- **Tasks**: Kanban/Scrum task management with assignees, labels, comments
- **Sprints**: Sprint planning and tracking with task management
- **Notifications**: Real-time notifications with Socket.IO
- **AI Integration**: Task description enhancement, time estimation, chat assistant
- **File Attachments**: Secure file upload with Supabase Storage
- **Admin Panel**: User management, system statistics, activity logs

## 📁 Project Structure

```
src/
├── config/                 # Configuration files
│   ├── index.ts           # Main config (env, cors, rate limits)
│   ├── constants.ts       # Enums and constants
│   └── supabase.ts        # Supabase client factories
├── middlewares/            # Express middlewares
│   ├── auth.ts            # Authentication & authorization
│   ├── errorHandler.ts    # Global error handler
│   ├── rateLimiter.ts     # Rate limiting
│   └── projectAccess.ts   # Project-level permissions
├── modules/                # Feature modules
│   ├── auth/              # Authentication
│   ├── users/             # User management
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   ├── sprints/           # Sprint management
│   ├── notifications/     # Notifications
│   ├── labels/            # Labels
│   ├── attachments/       # File attachments
│   ├── ai/                # AI integrations
│   └── admin/             # Admin functions
├── sockets/                # Socket.IO setup
├── types/                  # TypeScript types
│   ├── database.ts        # Database schema types
│   └── index.ts           # API types
├── utils/                  # Utility functions
│   ├── logger.ts          # Winston logger
│   ├── errors.ts          # Custom error classes
│   ├── response.ts        # Response helpers
│   └── helpers.ts         # General helpers
├── validators/             # Request validation
│   ├── schemas.ts         # Zod schemas
│   └── index.ts           # Validation middleware
└── index.ts               # App entry point
```

## 🛠 Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase project

### Installation

```bash
cd src/backend

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Configure your .env file with Supabase credentials
```

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT (uses Supabase JWT secret)
JWT_SECRET=your-jwt-secret

# AI (optional)
AI_API_URL=https://api.openai.com/v1
AI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4o-mini

# Storage
SUPABASE_STORAGE_BUCKET=attachments
```

### Running

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login user |
| POST | `/logout` | Logout user |
| POST | `/refresh` | Refresh tokens |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |
| POST | `/update-password` | Update password |
| GET | `/me` | Get current user |
| GET | `/oauth` | Get OAuth URL |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Search users |
| GET | `/:userId` | Get user by ID |
| PATCH | `/:userId` | Update user |
| DELETE | `/:userId` | Delete account |
| GET | `/:userId/preferences` | Get preferences |
| PATCH | `/:userId/preferences` | Update preferences |

### Projects (`/api/projects`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user's projects |
| POST | `/` | Create project |
| GET | `/:projectId` | Get project |
| PATCH | `/:projectId` | Update project |
| DELETE | `/:projectId` | Soft delete project |
| POST | `/:projectId/restore` | Restore project |
| GET | `/:projectId/members` | Get members |
| POST | `/:projectId/members` | Add member |
| PATCH | `/:projectId/members/:userId` | Update member role |
| DELETE | `/:projectId/members/:userId` | Remove member |
| POST | `/:projectId/invite` | Send invitation |
| POST | `/:projectId/join` | Request to join |

### Tasks (`/api/projects/:projectId/tasks`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get project tasks |
| POST | `/` | Create task |
| GET | `/:taskId` | Get task |
| PATCH | `/:taskId` | Update task |
| DELETE | `/:taskId` | Soft delete task |
| POST | `/:taskId/restore` | Restore task |
| POST | `/:taskId/move` | Move task status |
| GET | `/:taskId/comments` | Get comments |
| POST | `/:taskId/comments` | Add comment |
| PATCH | `/comments/:commentId` | Update comment |
| DELETE | `/comments/:commentId` | Delete comment |

### Sprints (`/api/projects/:projectId/sprints`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get sprints |
| POST | `/` | Create sprint |
| GET | `/current` | Get active sprint |
| GET | `/:sprintId` | Get sprint |
| PATCH | `/:sprintId` | Update sprint |
| DELETE | `/:sprintId` | Delete sprint |
| POST | `/:sprintId/end` | End sprint |
| POST | `/:sprintId/tasks` | Add tasks |
| DELETE | `/:sprintId/tasks` | Remove tasks |
| GET | `/:sprintId/stats` | Get statistics |

### Labels (`/api/projects/:projectId/labels`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get labels |
| POST | `/` | Create label |
| GET | `/:labelId` | Get label |
| PATCH | `/:labelId` | Update label |
| DELETE | `/:labelId` | Delete label |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get notifications |
| GET | `/unread-count` | Get unread count |
| POST | `/read-all` | Mark all read |
| PATCH | `/:id/read` | Mark as read |
| DELETE | `/:id` | Delete notification |
| DELETE | `/read` | Delete all read |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/enhance-description` | Enhance task description |
| POST | `/estimate-time` | Estimate task time |
| POST | `/chat` | Chat with assistant |
| POST | `/suggest-tasks` | Suggest tasks |
| POST | `/summarize-progress` | Summarize progress |
| GET | `/history` | Get AI history |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| PATCH | `/users/:id/status` | Update user status |
| PATCH | `/users/:id/role` | Update user role |
| DELETE | `/users/:id` | Delete user |
| GET | `/stats` | Get system stats |
| GET | `/activity` | Get activity logs |
| GET | `/projects` | Get all projects |
| DELETE | `/projects/:id` | Force delete project |

## 🔌 WebSocket Events

### Client → Server
| Event | Description |
|-------|-------------|
| `join:project` | Join project room |
| `leave:project` | Leave project room |
| `task:update` | Task updated |
| `task:move` | Task moved |
| `task:assign` | Task assigned |
| `comment:new` | New comment |
| `sprint:update` | Sprint updated |
| `typing:start` | User started typing |
| `typing:stop` | User stopped typing |
| `presence:update` | Presence status |

### Server → Client
| Event | Description |
|-------|-------------|
| `task:updated` | Task was updated |
| `task:moved` | Task was moved |
| `task:assigned` | Task was assigned |
| `comment:added` | Comment was added |
| `sprint:updated` | Sprint was updated |
| `user:typing` | User is typing |
| `user:stopped-typing` | User stopped typing |
| `user:presence` | User presence changed |
| `notification:new` | New notification |

## 🔒 Security

- **Helmet**: HTTP security headers
- **CORS**: Configurable origins
- **Rate Limiting**: Per-route limits
- **JWT Auth**: Supabase token verification
- **Role-based Access**: User/Admin roles
- **Project Permissions**: Owner/Admin/Member

## 📝 License

This project is licensed under the MIT License.
