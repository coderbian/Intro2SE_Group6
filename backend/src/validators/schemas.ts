import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// User validation schemas
export const userRegisterSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Project validation schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(2000).optional(),
  template: z.enum(['kanban', 'scrum']).optional().default('kanban'),
  visibility: z.enum(['private', 'public']).optional().default('private'),
  deadline: z.string().datetime().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  template: z.enum(['kanban', 'scrum']).optional(),
  visibility: z.enum(['private', 'public']).optional(),
  deadline: z.string().datetime().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

// Project member schemas
export const addMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['manager', 'member']).optional().default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['manager', 'member']),
});

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(500),
  description: z.string().max(10000).optional(),
  type: z.enum(['user-story', 'task']).optional().default('task'),
  status: z.enum(['backlog', 'todo', 'in-progress', 'done']).optional().default('backlog'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  assignees: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  due_date: z.string().datetime().optional().nullable(),
  story_points: z.number().int().min(0).max(100).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sprint_id: z.string().uuid().optional().nullable(),
  time_estimate: z.number().int().min(0).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  type: z.enum(['user-story', 'task']).optional(),
  status: z.enum(['backlog', 'todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignees: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  due_date: z.string().datetime().optional().nullable(),
  story_points: z.number().int().min(0).max(100).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sprint_id: z.string().uuid().optional().nullable(),
  time_estimate: z.number().int().min(0).optional().nullable(),
  time_spent: z.number().int().min(0).optional().nullable(),
  position_index: z.number().int().min(0).optional(),
});

export const moveTaskSchema = z.object({
  status: z.enum(['backlog', 'todo', 'in-progress', 'done']),
  position_index: z.number().int().min(0).optional(),
});

// Sprint validation schemas
export const createSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').max(255),
  goal: z.string().max(2000).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  task_ids: z.array(z.string().uuid()).optional(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  goal: z.string().max(2000).optional().nullable(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export const endSprintSchema = z.object({
  move_incomplete_to_backlog: z.boolean().optional().default(true),
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000),
  parent_id: z.string().uuid().optional().nullable(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

// Label validation schemas
export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use #RRGGBB)'),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Notification schemas
export const markNotificationReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
  mark_all: z.boolean().optional(),
});

// User preferences schemas
export const updatePreferencesSchema = z.object({
  notifications: z.object({
    taskAssigned: z.boolean().optional(),
    taskCompleted: z.boolean().optional(),
    projectUpdates: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
  }).optional(),
  display: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    language: z.enum(['vi', 'en']).optional(),
  }).optional(),
});

// Board/List schemas
export const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(200),
  position_index: z.number().int().min(0).optional(),
});

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(200),
  category: z.enum(['backlog', 'todo', 'in-progress', 'done']),
  board_id: z.string().uuid(),
  position_index: z.number().int().min(0).optional(),
});

// Join request schemas
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['manager', 'member']).optional().default('member'),
});

export const respondToRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

// AI schemas
export const aiEnhanceSchema = z.object({
  description: z.string().min(1, 'Description is required').max(10000),
  context: z.string().max(5000).optional(),
});

export const aiEstimateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(10000).optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  projectContext: z.string().max(10000).optional(),
});

// Alias exports for compatibility with routes
export const registerSchema = userRegisterSchema;
export const loginSchema = userLoginSchema;
export const forgotPasswordSchema = resetPasswordSchema;
export const updatePasswordSchema = changePasswordSchema;
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export const enhanceDescriptionSchema = aiEnhanceSchema;
export const estimateTimeSchema = aiEstimateSchema;
export const chatSchema = aiChatSchema;
export const suggestTasksSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  context: z.string().max(5000).optional(),
});
export const summarizeProgressSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
});

// Type exports
export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type CreateSprint = z.infer<typeof createSprintSchema>;
export type UpdateSprint = z.infer<typeof updateSprintSchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type CreateLabel = z.infer<typeof createLabelSchema>;
export type UpdatePreferences = z.infer<typeof updatePreferencesSchema>;
