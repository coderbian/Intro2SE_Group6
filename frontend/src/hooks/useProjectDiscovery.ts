"use client"

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

// Type for discoverable project from the RPC
export type DiscoverableProject = Database['public']['Functions']['get_discoverable_projects']['Returns'][number];

interface UseProjectDiscoveryProps {
    initialQuery?: string;
}

interface UseProjectDiscoveryReturn {
    projects: DiscoverableProject[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    requestToJoin: (projectId: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useProjectDiscovery({ initialQuery = '' }: UseProjectDiscoveryProps = {}): UseProjectDiscoveryReturn {
    const [projects, setProjects] = useState<DiscoverableProject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Get current user on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setCurrentUserId(data.user.id);
            }
        });
    }, []);

    // Fetch discoverable projects
    const fetchDiscoverableProjects = useCallback(async (query: string) => {
        if (!currentUserId) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('get_discoverable_projects', {
                search_text: query,
            });

            if (rpcError) {
                throw rpcError;
            }

            setProjects(data || []);
        } catch (err: any) {
            console.error('Error fetching discoverable projects:', err);
            setError(err.message || 'Không thể tải danh sách dự án');
            toast.error('Không thể tải danh sách dự án');
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    // Debounced fetch on query change
    useEffect(() => {
        if (!currentUserId) return;

        const timeoutId = setTimeout(() => {
            fetchDiscoverableProjects(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentUserId, fetchDiscoverableProjects]);

    // Request to join a project with optimistic UI
    const requestToJoin = useCallback(async (projectId: string): Promise<boolean> => {
        if (!currentUserId) {
            toast.error('Vui lòng đăng nhập');
            return false;
        }

        // Optimistic update - immediately mark as requested
        setProjects((prev) =>
            prev.map((project) =>
                project.id === projectId ? { ...project, has_requested: true } : project
            )
        );

        try {
            const { error: insertError } = await supabase.from('join_requests').insert({
                project_id: projectId,
                user_id: currentUserId,
                request_type: 'request', // CRITICAL: Must be 'request', not 'invitation'
                status: 'pending',
            });

            if (insertError) {
                // Check for unique constraint violation (already requested)
                if (insertError.code === '23505') {
                    toast.info('Bạn đã gửi yêu cầu tham gia dự án này rồi');
                    return false;
                }
                throw insertError;
            }

            // Get project name for notification
            const project = projects.find(p => p.id === projectId);
            const projectName = project?.name || 'dự án';

            // Create notification for user
            await supabase.from('notifications').insert({
                user_id: currentUserId,
                type: 'join_request_sent',
                title: 'Đã gửi yêu cầu tham gia',
                message: `Bạn đã gửi yêu cầu tham gia dự án "${projectName}". Chủ dự án sẽ xem xét yêu cầu của bạn.`,
                entity_type: 'project',
                entity_id: projectId,
                project_id: projectId,
                is_read: false,
            });

            toast.success('Đã gửi yêu cầu tham gia dự án');
            return true;
        } catch (err: any) {
            console.error('Error requesting to join project:', err);

            // Rollback optimistic update on error
            setProjects((prev) =>
                prev.map((project) =>
                    project.id === projectId ? { ...project, has_requested: false } : project
                )
            );

            toast.error('Không thể gửi yêu cầu: ' + (err.message || 'Đã xảy ra lỗi'));
            return false;
        }
    }, [currentUserId]);

    // Manual refetch function
    const refetch = useCallback(async () => {
        await fetchDiscoverableProjects(searchQuery);
    }, [fetchDiscoverableProjects, searchQuery]);

    return {
        projects,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        requestToJoin,
        refetch,
    };
}
