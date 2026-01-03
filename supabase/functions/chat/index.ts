// Supabase Edge Function: AI Chat Assistant using Google Gemini
// Deploy with: supabase functions deploy chat

import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { message, history, projectContext } = await req.json();

        if (!message || typeof message !== "string") {
            return new Response(
                JSON.stringify({ error: "Message is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build conversation history for context
        const systemPrompt = `Bạn là AI Assistant thông minh cho hệ thống quản lý dự án Planora.

NHIỆM VỤ:
- Hỗ trợ người dùng về quản lý dự án, Agile, Scrum, KanBan
- Trả lời câu hỏi về cách sử dụng hệ thống
- Giúp viết mô tả task, user stories, mô tả sprint, mô tả dự án
- Đưa ra lời khuyên về ước tính thời gian, ưu tiên công việc
- Gợi ý các công việc cần làm dựa trên mô tả dự án

PHONG CÁCH:
- Thân thiện, chuyên nghiệp
- Trả lời ngắn gọn, súc tích (tối đa 3-4 đoạn)
- Sử dụng tiếng Việt
- Có thể dùng emoji phù hợp

${projectContext ? `CONTEXT DỰ ÁN HIỆN TẠI:\n${projectContext}` : ""}`;

        // Convert history to Gemini format
        const chatHistory = (history || []).map((msg: ChatMessage) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Xin chào! Tôi là AI Assistant của Planora. Tôi có thể giúp gì cho bạn về quản lý dự án hôm nay?" }] },
                ...chatHistory,
            ],
        });

        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        return new Response(
            JSON.stringify({ reply }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
