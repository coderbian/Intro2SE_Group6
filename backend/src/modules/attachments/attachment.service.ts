import { getSupabaseAdminClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { Tables, TablesInsert } from '../../types/database.js';
import type { ServiceResult } from '../../types/index.js';
import crypto from 'crypto';

const supabase = getSupabaseAdminClient();

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'attachments';

/**
 * Get attachments by task
 */
export async function getAttachmentsByTask(taskId: string): Promise<ServiceResult<Tables<'attachments'>[]>> {
  try {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: attachments || [] };
  } catch (error) {
    logger.error('Error getting attachments', { error, taskId });
    return { success: false, error: 'Failed to fetch attachments' };
  }
}

/**
 * Get attachment by ID
 */
export async function getAttachmentById(attachmentId: string): Promise<ServiceResult<Tables<'attachments'>>> {
  try {
    const { data: attachment, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (error || !attachment) {
      return { success: false, error: 'Attachment not found', statusCode: 404 };
    }

    return { success: true, data: attachment };
  } catch (error) {
    logger.error('Error getting attachment', { error, attachmentId });
    return { success: false, error: 'Failed to fetch attachment' };
  }
}

/**
 * Upload attachment
 */
export async function uploadAttachment(
  taskId: string,
  uploadedBy: string,
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }
): Promise<ServiceResult<Tables<'attachments'>>> {
  try {
    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const uniqueId = crypto.randomUUID();
    const storagePath = `tasks/${taskId}/${uniqueId}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Storage upload error', { uploadError });
      return { success: false, error: 'Failed to upload file' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    // Create attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .insert({
        task_id: taskId,
        uploaded_by: uploadedBy,
        file_name: file.originalname,
        file_url: urlData.publicUrl,
        file_type: file.mimetype,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback storage upload
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw dbError;
    }

    return { success: true, data: attachment };
  } catch (error) {
    logger.error('Error uploading attachment', { error, taskId });
    return { success: false, error: 'Failed to upload attachment' };
  }
}

/**
 * Delete attachment
 */
export async function deleteAttachment(
  attachmentId: string,
  userId: string
): Promise<ServiceResult<void>> {
  try {
    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return { success: false, error: 'Attachment not found', statusCode: 404 };
    }

    // Check if user can delete (uploader or admin)
    if (attachment.uploaded_by !== userId) {
      // Check if user is admin or project manager
      const { data: task } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('id', attachment.task_id)
        .single();

      if (task) {
        const { data: member } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', task.project_id)
          .eq('user_id', userId)
          .single();

        if (!member || !['owner', 'admin'].includes(member.role || '')) {
          return { success: false, error: 'Not authorized to delete this attachment', statusCode: 403 };
        }
      }
    }

    // Extract storage path from URL
    const urlParts = attachment.file_url.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting attachment', { error, attachmentId });
    return { success: false, error: 'Failed to delete attachment' };
  }
}

/**
 * Get attachment download URL (signed URL for private buckets)
 */
export async function getDownloadUrl(attachmentId: string): Promise<ServiceResult<{ url: string; expiresIn: number }>> {
  try {
    const attachmentResult = await getAttachmentById(attachmentId);
    
    if (!attachmentResult.success || !attachmentResult.data) {
      return { success: false, error: 'Attachment not found', statusCode: 404 };
    }

    // Extract storage path
    const attachment = attachmentResult.data;
    const urlParts = attachment.url.split(`${STORAGE_BUCKET}/`);
    
    if (urlParts.length <= 1) {
      return { success: true, data: { url: attachment.url, expiresIn: 0 } };
    }

    const storagePath = urlParts[1];

    // Create signed URL (expires in 1 hour)
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (error) {
      // Fallback to public URL
      return { success: true, data: { url: attachment.url, expiresIn: 0 } };
    }

    return { success: true, data: { url: data.signedUrl, expiresIn: 3600 } };
  } catch (error) {
    logger.error('Error getting download URL', { error, attachmentId });
    return { success: false, error: 'Failed to get download URL' };
  }
}

/**
 * Get total storage used by task
 */
export async function getTaskStorageUsage(taskId: string): Promise<ServiceResult<number>> {
  try {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('file_size')
      .eq('task_id', taskId);

    if (error) throw error;

    const totalBytes = (attachments || []).reduce((sum, a) => sum + (a.file_size || 0), 0);
    return { success: true, data: totalBytes };
  } catch (error) {
    logger.error('Error getting task storage usage', { error, taskId });
    return { success: false, error: 'Failed to calculate storage usage' };
  }
}

export default {
  getAttachmentsByTask,
  getAttachmentById,
  uploadAttachment,
  deleteAttachment,
  getDownloadUrl,
  getTaskStorageUsage,
};
