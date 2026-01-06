// Re-export all types from services and hooks for a centralized type module
export type { User } from '../hooks/useAuth';
export type {
    Project,
    ProjectMember,
    ProjectInvitation,
    JoinRequest
} from '../services/projectService';
export type {
    Task,
    TaskProposal,
    Comment,
    Attachment
} from '../services/taskService';
export type { Sprint } from '../services/sprintService';
export type { Notification } from '../services/notificationService';
export type { Settings } from '../hooks/useSettings';

// Admin page type
export type AdminPage = "users" | "roles" | "monitoring" | "settings" | "backup";
