import { Request, Response, NextFunction } from 'express';
import type { Tables } from './database.js';

// User types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
}

// Extended Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  accessToken?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Error types
export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Controller handler type
export type AsyncHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Service result type
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Project Member with user details
export interface ProjectMemberWithUser {
  userId: string;
  role: string;
  joinedAt: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

// Task with relations
export interface TaskWithRelations extends Tables<'tasks'> {
  assignees: {
    userId: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    };
  }[];
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
  comments: CommentWithAuthor[];
  attachments: Tables<'attachments'>[];
  reporter?: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

// Comment with author
export interface CommentWithAuthor extends Tables<'comments'> {
  author: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

// Notification with entity details
export interface NotificationWithDetails extends Tables<'notifications'> {
  entity?: {
    type: string;
    id: string;
    name?: string;
  };
}

// Socket event types
export interface SocketEvents {
  // Task events
  'task:created': { task: Tables<'tasks'>; projectId: string };
  'task:updated': { task: Tables<'tasks'>; projectId: string };
  'task:deleted': { taskId: string; projectId: string };
  
  // Project events
  'project:updated': { project: Tables<'projects'> };
  'project:member:added': { projectId: string; member: ProjectMemberWithUser };
  'project:member:removed': { projectId: string; userId: string };
  
  // Sprint events
  'sprint:created': { sprint: Tables<'sprints'>; projectId: string };
  'sprint:ended': { sprint: Tables<'sprints'>; projectId: string };
  
  // Comment events
  'comment:created': { comment: CommentWithAuthor; taskId: string };
  'comment:deleted': { commentId: string; taskId: string };
  
  // Notification events
  'notification:new': { notification: Tables<'notifications'> };
}

// AI Service types
export interface AIEnhanceRequest {
  description: string;
  context?: string;
}

export interface AIEstimateRequest {
  title: string;
  description: string;
  complexity?: 'low' | 'medium' | 'high';
}

export interface AIChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  projectContext?: string;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
