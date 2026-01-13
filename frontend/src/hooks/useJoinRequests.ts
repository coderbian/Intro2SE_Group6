"use client"

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase-client';
import type { JoinRequest } from './useProjects';

interface UseJoinRequestsProps {
    userId: string | null;
    managedProjectIds: string[]; // Projects where user is owner or manager
}

export function useJoinRequests({ userId, managedProjectIds }: UseJoinRequestsProps) {
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch join requests
    const fetchJoinRequests = useCallback(async () => {
        if (!userId || managedProjectIds.length === 0) {
            setJoinRequests([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('join_requests')
                .select(`
          id,
          project_id,
          user_id,
          request_type,
          status,
          created_at,
          projects!inner (
            id,
            name
          ),
          users!join_requests_user_id_fkey (
            id,
            name,
            email
          )
        `)
                .eq('request_type', 'request') // Only fetch requests, not invitations
                .in('project_id', managedProjectIds) // Only projects user manages
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedRequests: JoinRequest[] = (data || []).map((r: any) => ({
                id: r.id,
                projectId: r.project_id,
                projectName: r.projects?.name || 'Unknown Project',
                userId: r.user_id,
                userName: r.users?.name || 'Unknown User',
                userEmail: r.users?.email || '',
                requestType: r.request_type,
                status: r.status,
                createdAt: r.created_at,
            }));

            setJoinRequests(transformedRequests);
        } catch (err: any) {
            console.error('Error fetching join requests:', err);
            toast.error('Không thể tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    }, [userId, managedProjectIds]);

    // Initial fetch
    useEffect(() => {
        fetchJoinRequests();
        // fetchJoinRequests is memoized, safe to omit from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, managedProjectIds.join(',')]);

    // Realtime subscription
    useEffect(() => {
        if (!userId || managedProjectIds.length === 0) return;

        const channel = supabase
            .channel(`join_requests_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'join_requests',
                    filter: `project_id=in.(${managedProjectIds.join(',')})`,
                },
                () => {
                    console.log('Join request updated, refetching...');
                    fetchJoinRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // fetchJoinRequests is stable, safe to omit
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, managedProjectIds.join(',')]);

    // Approve join request
    const handleApproveJoinRequest = useCallback(async (requestId: string) => {
        try {
            const { error } = await supabase.rpc('approve_join_request', {
                request_id: requestId,
            });

            if (error) throw error;

            toast.success('Đã chấp nhận yêu cầu tham gia');
            await fetchJoinRequests();
        } catch (err: any) {
            console.error('Error approving join request:', err);
            toast.error('Không thể chấp nhận yêu cầu: ' + (err.message || 'Lỗi không xác định'));
        }
    }, [fetchJoinRequests]);

    // Reject join request
    const handleRejectJoinRequest = useCallback(async (requestId: string) => {
        try {
            const { error } = await supabase.rpc('decline_join_request', {
                request_id: requestId,
            });

            if (error) throw error;

            toast.success('Đã từ chối yêu cầu tham gia');
            await fetchJoinRequests();
        } catch (err: any) {
            console.error('Error rejecting join request:', err);
            toast.error('Không thể từ chối yêu cầu: ' + (err.message || 'Lỗi không xác định'));
        }
    }, [fetchJoinRequests]);

    return {
        joinRequests,
        loading,
        handleApproveJoinRequest,
        handleRejectJoinRequest,
        refetch: fetchJoinRequests,
    };
}
