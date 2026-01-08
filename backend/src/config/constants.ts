// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// Project Member Roles
export const PROJECT_ROLES = {
  MANAGER: 'manager',
  MEMBER: 'member',
} as const;

// Task Status
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Task Type
export const TASK_TYPE = {
  USER_STORY: 'user-story',
  TASK: 'task',
} as const;

// Project Template
export const PROJECT_TEMPLATE = {
  KANBAN: 'kanban',
  SCRUM: 'scrum',
} as const;

// Project Visibility
export const PROJECT_VISIBILITY = {
  PRIVATE: 'private',
  PUBLIC: 'public',
} as const;

// Join Request Type
export const JOIN_REQUEST_TYPE = {
  INVITE: 'invite',
  REQUEST: 'request',
} as const;

// Join Request Status
export const JOIN_REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

// Sprint Status
export const SPRINT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

// Notification Types
export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  MEMBER_ADDED: 'member_added',
  PROJECT_UPDATE: 'project_update',
  TASK_MENTIONED: 'task_mentioned',
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

// Activity Log Entity Types
export const ENTITY_TYPE = {
  PROJECT: 'project',
  TASK: 'task',
  SPRINT: 'sprint',
  COMMENT: 'comment',
  MEMBER: 'member',
} as const;

// Activity Log Actions
export const LOG_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RESTORE: 'restore',
  ASSIGN: 'assign',
  UNASSIGN: 'unassign',
  MOVE: 'move',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;
