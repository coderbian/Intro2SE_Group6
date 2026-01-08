/**
 * Database Types for Planora Backend
 * This file mirrors the Supabase schema types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          phone: string | null;
          role: string;
          status: string;
          last_login_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          phone?: string | null;
          role?: string;
          status?: string;
          last_login_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          role?: string;
          status?: string;
          last_login_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          notifications: Json | null;
          display: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          notifications?: Json | null;
          display?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          notifications?: Json | null;
          display?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          description: string | null;
          key: string;
          template: string;
          visibility: string;
          settings: Json | null;
          deadline: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          description?: string | null;
          key: string;
          template?: string;
          visibility?: string;
          settings?: Json | null;
          deadline?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          description?: string | null;
          key?: string;
          template?: string;
          visibility?: string;
          settings?: Json | null;
          deadline?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string | null;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role?: string;
          joined_at?: string | null;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string | null;
        };
      };
      join_requests: {
        Row: {
          id: string;
          project_id: string | null;
          user_id: string | null;
          email: string | null;
          invited_by: string | null;
          request_type: string;
          status: string;
          token: string | null;
          expires_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          user_id?: string | null;
          email?: string | null;
          invited_by?: string | null;
          request_type: string;
          status?: string;
          token?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          user_id?: string | null;
          email?: string | null;
          invited_by?: string | null;
          request_type?: string;
          status?: string;
          token?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
      };
      boards: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          position_index: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          name: string;
          position_index?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          name?: string;
          position_index?: number;
          created_at?: string | null;
        };
      };
      lists: {
        Row: {
          id: string;
          board_id: string | null;
          name: string;
          category: string;
          position_index: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          board_id?: string | null;
          name: string;
          category: string;
          position_index?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          board_id?: string | null;
          name?: string;
          category?: string;
          position_index?: number;
          created_at?: string | null;
        };
      };
      sprints: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          goal: string | null;
          start_date: string | null;
          end_date: string | null;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          name: string;
          goal?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          name?: string;
          goal?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string | null;
          board_id: string | null;
          list_id: string | null;
          parent_id: string | null;
          sprint_id: string | null;
          reporter_id: string | null;
          title: string;
          description: string | null;
          type: string;
          status: string;
          priority: string;
          story_points: number | null;
          due_date: string | null;
          time_estimate: number | null;
          time_spent: number | null;
          task_number: number;
          position_index: number | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          board_id?: string | null;
          list_id?: string | null;
          parent_id?: string | null;
          sprint_id?: string | null;
          reporter_id?: string | null;
          title: string;
          description?: string | null;
          type?: string;
          status?: string;
          priority?: string;
          story_points?: number | null;
          due_date?: string | null;
          time_estimate?: number | null;
          time_spent?: number | null;
          task_number: number;
          position_index?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          board_id?: string | null;
          list_id?: string | null;
          parent_id?: string | null;
          sprint_id?: string | null;
          reporter_id?: string | null;
          title?: string;
          description?: string | null;
          type?: string;
          status?: string;
          priority?: string;
          story_points?: number | null;
          due_date?: string | null;
          time_estimate?: number | null;
          time_spent?: number | null;
          task_number?: number;
          position_index?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      task_assignees: {
        Row: {
          task_id: string;
          user_id: string;
          assigned_at: string | null;
          assigned_by: string | null;
        };
        Insert: {
          task_id: string;
          user_id: string;
          assigned_at?: string | null;
          assigned_by?: string | null;
        };
        Update: {
          task_id?: string;
          user_id?: string;
          assigned_at?: string | null;
          assigned_by?: string | null;
        };
      };
      labels: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          color: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          name: string;
          color: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          name?: string;
          color?: string;
        };
      };
      task_labels: {
        Row: {
          task_id: string;
          label_id: string;
        };
        Insert: {
          task_id: string;
          label_id: string;
        };
        Update: {
          task_id?: string;
          label_id?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          task_id: string | null;
          author_id: string | null;
          parent_id: string | null;
          content: string;
          is_edited: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          author_id?: string | null;
          parent_id?: string | null;
          content: string;
          is_edited?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string | null;
          author_id?: string | null;
          parent_id?: string | null;
          content?: string;
          is_edited?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      attachments: {
        Row: {
          id: string;
          task_id: string | null;
          comment_id: string | null;
          name: string;
          url: string;
          type: string;
          file_size: number;
          uploaded_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          comment_id?: string | null;
          name: string;
          url: string;
          type: string;
          file_size: number;
          uploaded_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string | null;
          comment_id?: string | null;
          name?: string;
          url?: string;
          type?: string;
          file_size?: number;
          uploaded_by?: string | null;
          created_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string | null;
          title: string | null;
          content: string | null;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean | null;
          read_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          title?: string | null;
          content?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          title?: string | null;
          content?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean | null;
          read_at?: string | null;
          created_at?: string | null;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          project_id: string | null;
          task_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          action: string | null;
          old_value: Json | null;
          new_value: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          action?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          action?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          created_at?: string | null;
        };
      };
      ai_interactions: {
        Row: {
          id: string;
          user_id: string | null;
          project_id: string | null;
          task_id: string | null;
          feature: string | null;
          provider: string | null;
          model: string | null;
          request: Json | null;
          response: Json | null;
          tokens: number | null;
          cost_usd: number | null;
          status: string | null;
          rating: number | null;
          feedback: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
          feature?: string | null;
          provider?: string | null;
          model?: string | null;
          request?: Json | null;
          response?: Json | null;
          tokens?: number | null;
          cost_usd?: number | null;
          status?: string | null;
          rating?: number | null;
          feedback?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          task_id?: string | null;
          feature?: string | null;
          provider?: string | null;
          model?: string | null;
          request?: Json | null;
          response?: Json | null;
          tokens?: number | null;
          cost_usd?: number | null;
          status?: string | null;
          rating?: number | null;
          feedback?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Functions: {
      is_project_member: {
        Args: { _project_id: string };
        Returns: boolean;
      };
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];
