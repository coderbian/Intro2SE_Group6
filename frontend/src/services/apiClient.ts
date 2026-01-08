import { getSupabaseClient } from '../lib/supabase-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Base API client with authentication
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file with multipart/form-data
   */
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const headers = await this.getAuthHeaders();
    delete (headers as any)['Content-Type']; // Let browser set it with boundary

    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// ===== PROJECTS API =====
export const projectsApi = {
  getAll: () => apiClient.get<{ success: boolean; data: any[] }>('/projects'),
  getById: (id: string) => apiClient.get<{ success: boolean; data: any }>(`/projects/${id}`),
  create: (data: any) => apiClient.post<{ success: boolean; data: any }>('/projects', data),
  update: (id: string, data: any) => apiClient.put<{ success: boolean; data: any }>(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/projects/${id}`),
  getMembers: (id: string) => apiClient.get<{ success: boolean; data: any[] }>(`/projects/${id}/members`),
  addMember: (id: string, data: any) => apiClient.post<{ success: boolean; data: any }>(`/projects/${id}/members`, data),
  updateMemberRole: (projectId: string, userId: string, role: string) =>
    apiClient.patch<{ success: boolean }>(`/projects/${projectId}/members/${userId}`, { role }),
  removeMember: (projectId: string, userId: string) =>
    apiClient.delete<{ success: boolean }>(`/projects/${projectId}/members/${userId}`),
};

// ===== TASKS API =====
export const tasksApi = {
  getAll: (projectId: string) => 
    apiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/tasks`),
  getById: (projectId: string, taskId: string) =>
    apiClient.get<{ success: boolean; data: any }>(`/projects/${projectId}/tasks/${taskId}`),
  create: (projectId: string, data: any) =>
    apiClient.post<{ success: boolean; data: any }>(`/projects/${projectId}/tasks`, data),
  update: (projectId: string, taskId: string, data: any) =>
    apiClient.put<{ success: boolean; data: any }>(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId: string, taskId: string) =>
    apiClient.delete<{ success: boolean }>(`/projects/${projectId}/tasks/${taskId}`),
  assignUser: (projectId: string, taskId: string, userId: string) =>
    apiClient.post<{ success: boolean }>(`/projects/${projectId}/tasks/${taskId}/assignees`, { userId }),
  unassignUser: (projectId: string, taskId: string, userId: string) =>
    apiClient.delete<{ success: boolean }>(`/projects/${projectId}/tasks/${taskId}/assignees/${userId}`),
};

// ===== SPRINTS API =====
export const sprintsApi = {
  getAll: (projectId: string) =>
    apiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/sprints`),
  getById: (projectId: string, sprintId: string) =>
    apiClient.get<{ success: boolean; data: any }>(`/projects/${projectId}/sprints/${sprintId}`),
  create: (projectId: string, data: any) =>
    apiClient.post<{ success: boolean; data: any }>(`/projects/${projectId}/sprints`, data),
  update: (projectId: string, sprintId: string, data: any) =>
    apiClient.put<{ success: boolean; data: any }>(`/projects/${projectId}/sprints/${sprintId}`, data),
  delete: (projectId: string, sprintId: string) =>
    apiClient.delete<{ success: boolean }>(`/projects/${projectId}/sprints/${sprintId}`),
  start: (projectId: string, sprintId: string) =>
    apiClient.post<{ success: boolean }>(`/projects/${projectId}/sprints/${sprintId}/start`, {}),
  complete: (projectId: string, sprintId: string) =>
    apiClient.post<{ success: boolean }>(`/projects/${projectId}/sprints/${sprintId}/complete`, {}),
};

// ===== COMMENTS API =====
export const commentsApi = {
  getAll: (projectId: string, taskId: string) =>
    apiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/tasks/${taskId}/comments`),
  create: (projectId: string, taskId: string, content: string) =>
    apiClient.post<{ success: boolean; data: any }>(`/projects/${projectId}/tasks/${taskId}/comments`, { content }),
  update: (projectId: string, taskId: string, commentId: string, content: string) =>
    apiClient.put<{ success: boolean }>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { content }),
  delete: (projectId: string, taskId: string, commentId: string) =>
    apiClient.delete<{ success: boolean }>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`),
};

// ===== ATTACHMENTS API =====
export const attachmentsApi = {
  upload: (projectId: string, taskId: string, file: File) =>
    apiClient.uploadFile<{ success: boolean; data: any }>(`/projects/${projectId}/tasks/${taskId}/attachments`, file),
  delete: (projectId: string, taskId: string, attachmentId: string) =>
    apiClient.delete<{ success: boolean }>(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`),
};

// ===== LABELS API =====
export const labelsApi = {
  getAll: (projectId: string) =>
    apiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/labels`),
  create: (projectId: string, data: any) =>
    apiClient.post<{ success: boolean; data: any }>(`/projects/${projectId}/labels`, data),
  update: (projectId: string, labelId: string, data: any) =>
    apiClient.put<{ success: boolean; data: any }>(`/projects/${projectId}/labels/${labelId}`, data),
  delete: (projectId: string, labelId: string) =>
    apiClient.delete<{ success: boolean }>(`/projects/${projectId}/labels/${labelId}`),
};

// ===== NOTIFICATIONS API =====
export const notificationsApi = {
  getAll: () => apiClient.get<{ success: boolean; data: any[] }>('/notifications'),
  markAsRead: (id: string) => apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`, {}),
  markAllAsRead: () => apiClient.patch<{ success: boolean }>('/notifications/read-all', {}),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/notifications/${id}`),
};

// ===== USERS API =====
export const usersApi = {
  getProfile: () => apiClient.get<{ success: boolean; data: any }>('/users/profile'),
  updateProfile: (data: any) => apiClient.put<{ success: boolean; data: any }>('/users/profile', data),
  searchUsers: (query: string) => apiClient.get<{ success: boolean; data: any[] }>(`/users/search?q=${query}`),
};

// ===== AI API =====
export const aiApi = {
  enhanceDescription: (description: string) =>
    apiClient.post<{ success: boolean; data: { enhanced: string } }>('/ai/enhance-description', { description }),
  estimateTime: (taskData: any) =>
    apiClient.post<{ success: boolean; data: { estimatedHours: number } }>('/ai/estimate-time', taskData),
  generateSubtasks: (taskData: any) =>
    apiClient.post<{ success: boolean; data: { subtasks: any[] } }>('/ai/generate-subtasks', taskData),
};

export default apiClient;
