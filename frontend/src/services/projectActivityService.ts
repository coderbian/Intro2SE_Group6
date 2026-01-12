import { getSupabaseClient } from '../lib/supabase-client';

export interface ProjectActivityLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    user_id: string | null;
    user_name?: string;
    project_id: string | null;
    task_id: string | null;
    task_title?: string;
    old_value: any;
    new_value: any;
    created_at: string;
}

/**
 * Fetch activity logs for a specific project
 */
export async function getProjectActivityLogs(projectId: string, limit: number = 50): Promise<ProjectActivityLog[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('activity_logs')
        .select(`
            *,
            users:user_id (name),
            tasks:task_id (title)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching project activity logs:', error);
        return [];
    }

    return (data || []).map((log: any) => ({
        id: log.id,
        action: log.action || 'unknown',
        entity_type: log.entity_type || 'unknown',
        entity_id: log.entity_id,
        user_id: log.user_id,
        user_name: log.users?.name || 'Unknown',
        project_id: log.project_id,
        task_id: log.task_id,
        task_title: log.tasks?.title,
        old_value: log.old_value,
        new_value: log.new_value,
        created_at: log.created_at || new Date().toISOString(),
    }));
}

/**
 * Log an activity for a project
 */
export async function logProjectActivity(params: {
    projectId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    taskId?: string;
    oldValue?: any;
    newValue?: any;
}): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('activity_logs')
        .insert({
            project_id: params.projectId,
            user_id: params.userId,
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId || null,
            task_id: params.taskId || null,
            old_value: params.oldValue || null,
            new_value: params.newValue || null,
        });

    if (error) {
        console.error('Error logging activity:', error);
    }
}

/**
 * Get action label in Vietnamese
 */
export function getActionLabel(action: string, entityType: string): string {
    const labels: Record<string, Record<string, string>> = {
        'task': {
            'created': 'đã tạo công việc',
            'updated': 'đã cập nhật công việc',
            'deleted': 'đã xóa công việc',
            'status_changed': 'đã thay đổi trạng thái',
            'assigned': 'đã giao công việc cho',
            'comment_added': 'đã bình luận về',
        },
        'project': {
            'created': 'đã tạo dự án',
            'updated': 'đã cập nhật dự án',
            'deleted': 'đã xóa dự án',
        },
        'member': {
            'added': 'đã thêm thành viên',
            'removed': 'đã xóa thành viên',
            'role_changed': 'đã thay đổi vai trò',
        },
        'sprint': {
            'created': 'đã tạo sprint',
            'started': 'đã bắt đầu sprint',
            'ended': 'đã kết thúc sprint',
        },
    };

    return labels[entityType]?.[action] || `${action} ${entityType}`;
}
