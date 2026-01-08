import { getSupabaseAdminClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { ServiceResult } from '../../types/index.js';
import type { Tables, TablesInsert } from '../../types/database.js';
import config from '../../config/index.js';

const supabase = getSupabaseAdminClient();

// AI Provider configuration
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

/**
 * Call AI API
 */
async function callAI(messages: Array<{ role: string; content: string }>, options?: {
  temperature?: number;
  max_tokens?: number;
}): Promise<ServiceResult<string>> {
  try {
    if (!AI_API_KEY) {
      return { success: false, error: 'AI service not configured', statusCode: 503 };
    }

    const response = await fetch(`${AI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('AI API error', { error, status: response.status });
      return { success: false, error: 'AI service unavailable' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'No response from AI' };
    }

    return { success: true, data: content };
  } catch (error) {
    logger.error('AI call error', { error });
    return { success: false, error: 'Failed to call AI service' };
  }
}

/**
 * Log AI interaction
 */
async function logInteraction(
  userId: string,
  type: string,
  input: string,
  output: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('ai_interactions').insert({
      user_id: userId,
      interaction_type: type,
      input_text: input,
      output_text: output,
      metadata,
    });
  } catch (error) {
    logger.error('Failed to log AI interaction', { error });
  }
}

/**
 * Enhance task description
 */
export async function enhanceDescription(
  userId: string,
  title: string,
  currentDescription?: string,
  context?: string
): Promise<ServiceResult<string>> {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that enhances task descriptions for project management. 
        Make the description clear, actionable, and professional. Include acceptance criteria when appropriate.
        Keep it concise but comprehensive. Format using Markdown.`,
      },
      {
        role: 'user',
        content: `Task Title: ${title}
${currentDescription ? `Current Description: ${currentDescription}` : ''}
${context ? `Additional Context: ${context}` : ''}

Please provide an enhanced description for this task.`,
      },
    ];

    const result = await callAI(messages, { temperature: 0.7, max_tokens: 500 });

    if (result.success && result.data) {
      await logInteraction(userId, 'enhance_description', title, result.data, { currentDescription, context });
    }

    return result;
  } catch (error) {
    logger.error('Enhance description error', { error });
    return { success: false, error: 'Failed to enhance description' };
  }
}

/**
 * Estimate task time
 */
export async function estimateTime(
  userId: string,
  title: string,
  description?: string,
  complexity?: 'low' | 'medium' | 'high'
): Promise<ServiceResult<{
  estimated_hours: number;
  confidence: 'low' | 'medium' | 'high';
  breakdown?: string;
}>> {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are an expert project manager who estimates task duration accurately.
        Consider the task complexity, typical development patterns, and potential blockers.
        Provide estimates in hours and include a confidence level.
        Return your response in JSON format: { "estimated_hours": number, "confidence": "low"|"medium"|"high", "breakdown": "brief explanation" }`,
      },
      {
        role: 'user',
        content: `Task: ${title}
${description ? `Description: ${description}` : ''}
${complexity ? `Complexity: ${complexity}` : ''}

Please estimate the time needed to complete this task.`,
      },
    ];

    const result = await callAI(messages, { temperature: 0.3, max_tokens: 300 });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to estimate time' };
    }

    try {
      // Parse JSON response
      const jsonMatch = result.data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        await logInteraction(userId, 'estimate_time', title, JSON.stringify(parsed), { description, complexity });
        return { success: true, data: parsed };
      }
    } catch (parseError) {
      logger.error('Failed to parse AI estimate response', { parseError, response: result.data });
    }

    // Fallback if parsing fails
    return {
      success: true,
      data: {
        estimated_hours: 4,
        confidence: 'low',
        breakdown: result.data,
      },
    };
  } catch (error) {
    logger.error('Estimate time error', { error });
    return { success: false, error: 'Failed to estimate time' };
  }
}

/**
 * Chat with AI assistant
 */
export async function chat(
  userId: string,
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  projectContext?: {
    projectName?: string;
    tasks?: Array<{ title: string; status: string }>;
    sprint?: { name: string; goal?: string };
  }
): Promise<ServiceResult<string>> {
  try {
    const systemPrompt = `You are Planora AI, a helpful project management assistant.
You help users with:
- Planning and organizing tasks
- Providing insights about project progress
- Suggesting best practices for agile/scrum methodologies
- Answering questions about project management
${projectContext ? `
Current project context:
- Project: ${projectContext.projectName || 'Not specified'}
${projectContext.sprint ? `- Current Sprint: ${projectContext.sprint.name} (Goal: ${projectContext.sprint.goal || 'Not set'})` : ''}
${projectContext.tasks ? `- Active Tasks: ${projectContext.tasks.length}` : ''}
` : ''}
Be concise, helpful, and professional. Use Markdown formatting when appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ];

    const result = await callAI(messages, { temperature: 0.7, max_tokens: 800 });

    if (result.success && result.data) {
      await logInteraction(userId, 'chat', message, result.data, { conversationHistory: conversationHistory.length });
    }

    return result;
  } catch (error) {
    logger.error('Chat error', { error });
    return { success: false, error: 'Failed to process chat message' };
  }
}

/**
 * Generate task suggestions based on project
 */
export async function suggestTasks(
  userId: string,
  projectName: string,
  projectDescription?: string,
  existingTasks?: string[]
): Promise<ServiceResult<Array<{ title: string; description: string; priority: string }>>> {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are a project planning expert. Suggest relevant tasks for the given project.
        Return your response as a JSON array of tasks with: title, description, priority (low/medium/high).
        Suggest 3-5 tasks that would be valuable additions to the project.`,
      },
      {
        role: 'user',
        content: `Project: ${projectName}
${projectDescription ? `Description: ${projectDescription}` : ''}
${existingTasks?.length ? `Existing tasks: ${existingTasks.join(', ')}` : ''}

Please suggest new tasks for this project.`,
      },
    ];

    const result = await callAI(messages, { temperature: 0.8, max_tokens: 600 });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to suggest tasks' };
    }

    try {
      const jsonMatch = result.data.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        await logInteraction(userId, 'suggest_tasks', projectName, JSON.stringify(parsed));
        return { success: true, data: parsed };
      }
    } catch (parseError) {
      logger.error('Failed to parse task suggestions', { parseError });
    }

    return { success: false, error: 'Failed to parse AI response' };
  } catch (error) {
    logger.error('Suggest tasks error', { error });
    return { success: false, error: 'Failed to suggest tasks' };
  }
}

/**
 * Summarize project progress
 */
export async function summarizeProgress(
  userId: string,
  projectName: string,
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
  },
  recentActivity?: string[]
): Promise<ServiceResult<string>> {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are a project analyst. Provide a brief, insightful summary of project progress.
        Highlight achievements, concerns, and recommendations. Keep it under 200 words.`,
      },
      {
        role: 'user',
        content: `Project: ${projectName}

Statistics:
- Total tasks: ${stats.totalTasks}
- Completed: ${stats.completedTasks}
- In Progress: ${stats.inProgressTasks}
- Overdue: ${stats.overdueTasks}
${recentActivity?.length ? `\nRecent Activity:\n${recentActivity.join('\n')}` : ''}

Please provide a progress summary.`,
      },
    ];

    const result = await callAI(messages, { temperature: 0.5, max_tokens: 400 });

    if (result.success && result.data) {
      await logInteraction(userId, 'summarize_progress', projectName, result.data, { stats });
    }

    return result;
  } catch (error) {
    logger.error('Summarize progress error', { error });
    return { success: false, error: 'Failed to summarize progress' };
  }
}

/**
 * Get AI interaction history for user
 */
export async function getInteractionHistory(
  userId: string,
  limit: number = 50
): Promise<ServiceResult<Tables<'ai_interactions'>[]>> {
  try {
    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error('Get interaction history error', { error });
    return { success: false, error: 'Failed to fetch interaction history' };
  }
}

export default {
  enhanceDescription,
  estimateTime,
  chat,
  suggestTasks,
  summarizeProgress,
  getInteractionHistory,
};
