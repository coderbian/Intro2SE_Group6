import { getSupabaseClient } from './supabase-client';

const supabase = getSupabaseClient();

/**
 * Enhance task description using AI (via Supabase Edge Function)
 */
export async function enhanceDescription(description: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('enhance-description', {
        body: { description },
    });

    if (error) {
        console.error('AI enhance error:', error);
        throw new Error(error.message || 'Lỗi khi gọi AI cải thiện văn phong');
    }

    if (!data?.enhanced) {
        throw new Error('Không nhận được phản hồi từ AI');
    }

    return data.enhanced;
}

/**
 * Estimate task completion time using AI (via Supabase Edge Function)
 */
export async function estimateTime(title: string, description: string): Promise<number> {
    const { data, error } = await supabase.functions.invoke('estimate-time', {
        body: { title, description },
    });

    if (error) {
        console.error('AI estimate error:', error);
        throw new Error(error.message || 'Lỗi khi gọi AI ước tính thời gian');
    }

    if (typeof data?.days !== 'number') {
        throw new Error('Không nhận được phản hồi từ AI');
    }

    return data.days;
}
