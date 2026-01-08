import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { sprintsApi } from '../services/apiClient';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  createdAt: string;
}

export function useSprints() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sprints for a project
  const fetchSprintsForProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      const response = await sprintsApi.getAll(projectId);
      if (response.success) {
        setSprints(prev => {
          const otherSprints = prev.filter(s => s.projectId !== projectId);
          return [...otherSprints, ...response.data];
        });
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
      toast.error('Không thể tải danh sách sprint');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create sprint
  const handleCreateSprint = useCallback(async (
    projectId: string,
    sprintData: Omit<Sprint, 'id' | 'projectId' | 'createdAt' | 'status'>
  ) => {
    try {
      const response = await sprintsApi.create(projectId, {
        ...sprintData,
        status: 'planning',
      });

      if (response.success) {
        const newSprint = response.data;
        setSprints(prev => [...prev, newSprint]);
        toast.success('Sprint đã được tạo thành công');
        return newSprint;
      }
    } catch (error: any) {
      console.error('Failed to create sprint:', error);
      toast.error(error.message || 'Không thể tạo sprint');
      return null;
    }
  }, []);

  // Update sprint
  const handleUpdateSprint = useCallback(async (sprintId: string, updates: Partial<Sprint>) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    try {
      const response = await sprintsApi.update(sprint.projectId, sprintId, updates);
      if (response.success) {
        setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, ...response.data } : s));
        toast.success('Sprint đã được cập nhật');
      }
    } catch (error: any) {
      console.error('Failed to update sprint:', error);
      toast.error(error.message || 'Không thể cập nhật sprint');
    }
  }, [sprints]);

  // Delete sprint
  const handleDeleteSprint = useCallback(async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    try {
      const response = await sprintsApi.delete(sprint.projectId, sprintId);
      if (response.success) {
        setSprints(prev => prev.filter(s => s.id !== sprintId));
        toast.success('Sprint đã được xóa');
      }
    } catch (error: any) {
      console.error('Failed to delete sprint:', error);
      toast.error(error.message || 'Không thể xóa sprint');
    }
  }, [sprints]);

  // Start sprint
  const handleStartSprint = useCallback(async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    try {
      const response = await sprintsApi.start(sprint.projectId, sprintId);
      if (response.success) {
        setSprints(prev => prev.map(s => 
          s.id === sprintId ? { ...s, status: 'active' as const } : s
        ));
        toast.success('Sprint đã được bắt đầu');
      }
    } catch (error: any) {
      console.error('Failed to start sprint:', error);
      toast.error(error.message || 'Không thể bắt đầu sprint');
    }
  }, [sprints]);

  // Complete sprint
  const handleCompleteSprint = useCallback(async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    try {
      const response = await sprintsApi.complete(sprint.projectId, sprintId);
      if (response.success) {
        setSprints(prev => prev.map(s => 
          s.id === sprintId ? { ...s, status: 'completed' as const } : s
        ));
        toast.success('Sprint đã hoàn thành');
      }
    } catch (error: any) {
      console.error('Failed to complete sprint:', error);
      toast.error(error.message || 'Không thể hoàn thành sprint');
    }
  }, [sprints]);

  return {
    sprints,
    setSprints,
    isLoading,
    fetchSprintsForProject,
    handleCreateSprint,
    handleUpdateSprint,
    handleDeleteSprint,
    handleStartSprint,
    handleCompleteSprint,
  };
}
