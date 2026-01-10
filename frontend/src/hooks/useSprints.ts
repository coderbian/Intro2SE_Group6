import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import type { Task } from './useTasks';

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  projectId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface UseSprintsProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useSprints({ tasks, setTasks }: UseSprintsProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sprints from Supabase
  const fetchSprints = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSprints([]);
        setLoading(false);
        return;
      }

      // Get user's projects first
      const { data: projectMembers, error: projectError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (projectError) throw projectError;

      const projectIds = projectMembers?.map(pm => pm.project_id) || [];

      if (projectIds.length === 0) {
        setSprints([]);
        setLoading(false);
        return;
      }

      // Fetch sprints for user's projects
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database format to app format
      const transformedSprints: Sprint[] = (data || []).map((dbSprint: any) => ({
        id: dbSprint.id,
        name: dbSprint.name,
        goal: dbSprint.goal || '',
        projectId: dbSprint.project_id,
        startDate: dbSprint.start_date,
        endDate: dbSprint.end_date,
        status: dbSprint.status,
        createdAt: dbSprint.created_at,
        updatedAt: dbSprint.updated_at,
      }));

      setSprints(transformedSprints);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching sprints:', error);
      toast.error('Failed to fetch sprints: ' + error.message);
      setLoading(false);
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    fetchSprints();

    // Subscribe to sprints changes
    const sprintsChannel = supabase
      .channel('sprints_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprints' },
        () => {
          fetchSprints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sprintsChannel);
    };
  }, []);

  // Create a new sprint
  const handleCreateSprint = async (projectId: string, name: string, goal: string, taskIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create sprints');
        return null;
      }

      // Get existing sprints for this project to calculate sprint number
      const existingSprints = sprints.filter(s => s.projectId === projectId);
      const sprintNumber = existingSprints.length + 1;

      const newSprintId = uuidv4();
      const now = new Date().toISOString();

      // Insert sprint into database
      const { data: newSprint, error: sprintError } = await supabase
        .from('sprints')
        .insert({
          id: newSprintId,
          name: name || `Sprint ${sprintNumber}`,
          goal,
          project_id: projectId,
          start_date: now,
          status: 'active',
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (sprintError) throw sprintError;

      // Update tasks with sprint ID and move to todo
      if (taskIds.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .update({
            sprint_id: newSprintId,
            status: 'todo',
            updated_at: now,
          })
          .in('id', taskIds);

        if (tasksError) throw tasksError;
      }

      // Update local state
      const transformedSprint: Sprint = {
        id: newSprint.id,
        name: newSprint.name,
        goal: newSprint.goal || '',
        projectId: newSprint.project_id || '',
        startDate: newSprint.start_date || now,
        endDate: newSprint.end_date || undefined,
        status: (newSprint.status as 'active' | 'completed') || 'active',
        createdAt: newSprint.created_at || now,
        updatedAt: newSprint.updated_at || now,
      };

      // Optimistic update
      setSprints(prev => [...prev, transformedSprint]);
      setTasks(prevTasks =>
        prevTasks.map(t =>
          taskIds.includes(t.id) ? { ...t, sprintId: newSprintId, status: 'todo' as const } : t
        )
      );

      toast.success(`Đã tạo ${transformedSprint.name}!`);
      await fetchSprints(); // Sync with database
      return transformedSprint;
    } catch (error: any) {
      console.error('Error creating sprint:', error);
      toast.error('Failed to create sprint: ' + error.message);
      return null;
    }
  };

  // End a sprint
  const handleEndSprint = async (sprintId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to end sprints');
        return { success: false };
      }

      const now = new Date().toISOString();

      // Update sprint status in database
      const { error: sprintError } = await supabase
        .from('sprints')
        .update({
          status: 'completed',
          end_date: now,
          updated_at: now,
        })
        .eq('id', sprintId);

      if (sprintError) throw sprintError;

      // Get tasks in this sprint
      const { data: sprintTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, type, parent_task_id')
        .eq('sprint_id', sprintId);

      if (tasksError) throw tasksError;

      // Separate user stories from regular tasks
      const sprintUserStoryIds = (sprintTasks || [])
        .filter((t: any) => t.type === 'user-story' || (!t.type && !t.parent_task_id))
        .map((t: any) => t.id);

      // Update incomplete tasks in sprint
      const incompleteTaskIds = (sprintTasks || [])
        .filter((t: any) => t.status !== 'done')
        .map((t: any) => t.id);

      if (incompleteTaskIds.length > 0) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            sprint_id: null,
            status: 'backlog',
            updated_at: now,
          })
          .in('id', incompleteTaskIds);

        if (updateError) throw updateError;
      }

      // Clear sprint_id from completed tasks
      const completeTaskIds = (sprintTasks || [])
        .filter((t: any) => t.status === 'done')
        .map((t: any) => t.id);

      if (completeTaskIds.length > 0) {
        const { error: clearError } = await supabase
          .from('tasks')
          .update({
            sprint_id: null,
            updated_at: now,
          })
          .in('id', completeTaskIds);

        if (clearError) throw clearError;
      }

      // Handle sub-tasks of user stories in sprint
      const { data: subTasks, error: subTasksError } = await supabase
        .from('tasks')
        .select('id, status')
        .in('parent_task_id', sprintUserStoryIds)
        .eq('type', 'task');

      if (subTasksError) throw subTasksError;

      const incompleteSubTaskIds = (subTasks || [])
        .filter((t: any) => t.status !== 'done')
        .map((t: any) => t.id);

      if (incompleteSubTaskIds.length > 0) {
        const { error: subTaskUpdateError } = await supabase
          .from('tasks')
          .update({
            status: 'todo',
            updated_at: now,
          })
          .in('id', incompleteSubTaskIds);

        if (subTaskUpdateError) throw subTaskUpdateError;
      }

      // Update local state
      setSprints(prevSprints =>
        prevSprints.map(s =>
          s.id === sprintId
            ? { ...s, status: 'completed' as const, endDate: now }
            : s
        )
      );

      setTasks(prevTasks =>
        prevTasks.map(t => {
          // Handle User Stories and Standalone Tasks in Sprint
          if (t.sprintId === sprintId) {
            if (t.status !== 'done') {
              return { ...t, sprintId: undefined, status: 'backlog' as 'backlog' };
            } else {
              return { ...t, sprintId: undefined };
            }
          }

          // Handle sub-tasks of User Stories in Sprint
          if (t.parentTaskId && sprintUserStoryIds.includes(t.parentTaskId) && t.type === 'task') {
            if (t.status !== 'done') {
              return { ...t, status: 'todo' as const };
            }
          }

          return t;
        })
      );

      toast.success('Sprint đã kết thúc! Các task chưa hoàn thành đã được chuyển về Backlog.');
      await fetchSprints(); // Sync with database
      return { success: true };
    } catch (error: any) {
      console.error('Error ending sprint:', error);
      toast.error('Failed to end sprint: ' + error.message);
      return { success: false };
    }
  };

  const getSprintsByProject = (projectId: string) => sprints.filter(s => s.projectId === projectId);

  const getCurrentSprint = (projectId: string) =>
    sprints.find(s => s.projectId === projectId && s.status === 'active');

  const getCompletedSprints = (projectId: string) =>
    sprints.filter(s => s.projectId === projectId && s.status === 'completed');

  return {
    sprints,
    setSprints,
    loading,
    handleCreateSprint,
    handleEndSprint,
    getSprintsByProject,
    getCurrentSprint,
    getCompletedSprints,
    fetchSprints,
  };
}
