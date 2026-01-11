// lib/notificationHelpers.ts
import { supabase } from './supabase-client';

export async function createTaskAssignedNotification(
  userId: string,
  taskTitle: string,
  projectId: string,
  projectName: string,
  taskId: string
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'task_assigned',
      title: `Bạn có nhiệm vụ mới "${taskTitle}"`,
      content: `Bạn có nhiệm vụ mới ${taskTitle} ở bên project ${projectName}`,
      entity_type: 'task',
      entity_id: taskId,
      metadata: {
        projectId,
        projectName,
        taskTitle,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function createTaskDueSoonNotification(
  userId: string,
  taskTitle: string,
  projectId: string,
  projectName: string,
  taskId: string,
  daysUntilDeadline: number
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'task_due_soon',
      title: `Nhiệm vụ "${taskTitle}" sắp đến hạn`,
      content: `Nhiệm vụ ${taskTitle} của bạn sẽ đến hạn sau ${daysUntilDeadline} ngày`,
      entity_type: 'task',
      entity_id: taskId,
      metadata: {
        projectId,
        projectName,
        taskTitle,
        daysUntilDeadline,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}