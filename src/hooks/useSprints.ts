import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import * as sprintService from '../services/sprintService';
import type { Task } from './useTasks';

export type { Sprint } from '../services/sprintService';

interface UseSprintsProps {
  projectIds?: string[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useSprints({ projectIds = [], tasks, setTasks }: UseSprintsProps) {
  const [sprints, setSprints] = useState<sprintService.Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sprints from Supabase when projectIds change
  useEffect(() => {
    if (projectIds.length === 0) {
      setSprints([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedSprints = await sprintService.fetchSprints(projectIds);
        setSprints(fetchedSprints);
      } catch (error) {
        console.error('Error fetching sprints:', error);
        toast.error('Không thể tải dữ liệu sprint');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectIds.join(',')]);

  const handleCreateSprint = useCallback(
    async (projectId: string, name: string, goal: string, taskIds: string[]) => {
      try {
        const newSprint = await sprintService.createSprint(
          projectId,
          name || `Sprint ${sprints.filter((s) => s.projectId === projectId).length + 1}`,
          goal
        );

        setSprints((prev) => [...prev, newSprint]);

        // Assign tasks to sprint
        if (taskIds.length > 0) {
          await sprintService.assignTasksToSprint(newSprint.id, taskIds);
          // Update local task state
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              taskIds.includes(t.id) ? { ...t, sprintId: newSprint.id, status: 'todo' as const } : t
            )
          );
        }

        toast.success(`Đã tạo ${newSprint.name}!`);
        return newSprint;
      } catch (error) {
        console.error('Error creating sprint:', error);
        toast.error('Không thể tạo sprint');
        return null;
      }
    },
    [sprints, setTasks]
  );

  const handleEndSprint = useCallback(
    async (sprintId: string) => {
      try {
        await sprintService.endSprint(sprintId);

        // Update local sprint state
        setSprints((prev) =>
          prev.map((s) =>
            s.id === sprintId
              ? { ...s, status: 'completed' as const, endDate: new Date().toISOString() }
              : s
          )
        );

        // Get User Stories in this sprint
        const sprintUserStoryIds = tasks
          .filter(
            (t) => t.sprintId === sprintId && (t.type === 'user-story' || (!t.type && !t.parentTaskId))
          )
          .map((t) => t.id);

        // Update local task state
        setTasks((prevTasks) =>
          prevTasks.map((t) => {
            // Handle tasks in the sprint
            if (t.sprintId === sprintId) {
              if (t.status !== 'done') {
                return { ...t, sprintId: undefined, status: 'backlog' as const };
              } else {
                return { ...t, sprintId: undefined };
              }
            }

            // Handle sub-tasks of User Stories in the sprint
            if (t.parentTaskId && sprintUserStoryIds.includes(t.parentTaskId) && t.type === 'task') {
              if (t.status !== 'done') {
                return { ...t, status: 'todo' as const };
              }
            }

            return t;
          })
        );

        toast.success('Sprint đã kết thúc! Các task chưa hoàn thành đã được chuyển về Backlog.');
      } catch (error) {
        console.error('Error ending sprint:', error);
        toast.error('Không thể kết thúc sprint');
      }
    },
    [tasks, setTasks]
  );

  const getSprintsByProject = useCallback(
    (projectId: string) => sprints.filter((s) => s.projectId === projectId),
    [sprints]
  );

  const getCurrentSprint = useCallback(
    (projectId: string) => sprints.find((s) => s.projectId === projectId && s.status === 'active'),
    [sprints]
  );

  const getCompletedSprints = useCallback(
    (projectId: string) => sprints.filter((s) => s.projectId === projectId && s.status === 'completed'),
    [sprints]
  );

  return {
    sprints,
    setSprints,
    isLoading,
    handleCreateSprint,
    handleEndSprint,
    getSprintsByProject,
    getCurrentSprint,
    getCompletedSprints,
  };
}
