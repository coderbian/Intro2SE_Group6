import { useState, useEffect } from 'react';
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
}

interface UseSprintsProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useSprints({ tasks, setTasks }: UseSprintsProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('planora_sprints', JSON.stringify(sprints));
  }, [sprints]);

  const handleCreateSprint = (projectId: string, name: string, goal: string, taskIds: string[]) => {
    const newSprint: Sprint = {
      id: Date.now().toString(),
      name: name || `Sprint ${sprints.filter((s) => s.projectId === projectId).length + 1}`,
      goal,
      projectId,
      startDate: new Date().toISOString(),
      status: 'active',
    };

    setSprints([...sprints, newSprint]);

    // Update tasks with sprint ID and move to todo
    setTasks(
      tasks.map((t) =>
        taskIds.includes(t.id) ? { ...t, sprintId: newSprint.id, status: 'todo' as const } : t
      )
    );

    toast.success(`Đã tạo ${newSprint.name}!`);
    return newSprint;
  };

  const handleEndSprint = (sprintId: string) => {
    // Mark sprint as completed
    setSprints(
      sprints.map((s) =>
        s.id === sprintId
          ? { ...s, status: 'completed' as const, endDate: new Date().toISOString() }
          : s
      )
    );

    // Lấy danh sách User Stories trong sprint này
    const sprintUserStoryIds = tasks
      .filter(
        (t) => t.sprintId === sprintId && (t.type === 'user-story' || (!t.type && !t.parentTaskId))
      )
      .map((t) => t.id);

    // Move incomplete tasks back to backlog and clear sprintId
    setTasks(
      tasks.map((t) => {
        // Xử lý User Stories và Standalone Tasks trong Sprint
        if (t.sprintId === sprintId) {
          if (t.status !== 'done') {
            // Task not completed - move back to backlog
            return { ...t, sprintId: undefined, status: 'backlog' as const };
          } else {
            // Task completed - just clear sprintId so it doesn't show in next sprint
            return { ...t, sprintId: undefined };
          }
        }

        // Xử lý sub-tasks của User Stories trong Sprint
        if (t.parentTaskId && sprintUserStoryIds.includes(t.parentTaskId) && t.type === 'task') {
          if (t.status !== 'done') {
            // Sub-task chưa hoàn thành - reset về todo để sẵn sàng cho sprint sau
            return { ...t, status: 'todo' as const };
          }
          // Sub-task đã done - giữ nguyên
        }

        return t;
      })
    );

    toast.success('Sprint đã kết thúc! Các task chưa hoàn thành đã được chuyển về Backlog.');
  };

  const getSprintsByProject = (projectId: string) => sprints.filter((s) => s.projectId === projectId);
  
  const getCurrentSprint = (projectId: string) =>
    sprints.find((s) => s.projectId === projectId && s.status === 'active');
  
  const getCompletedSprints = (projectId: string) =>
    sprints.filter((s) => s.projectId === projectId && s.status === 'completed');

  return {
    sprints,
    setSprints,
    handleCreateSprint,
    handleEndSprint,
    getSprintsByProject,
    getCurrentSprint,
    getCompletedSprints,
  };
}
