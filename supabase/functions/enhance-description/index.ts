// Supabase Edge Function: Enhance Description using Google Gemini
// Deploy with: supabase functions deploy enhance-description

import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

        const { description } = await req.json();

        if (!description || typeof description !== "string") {
            return new Response(
                JSON.stringify({ error: "Description is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Bạn là trợ lý viết mô tả task chuyên nghiệp cho hệ thống quản lý dự án.
Hãy cải thiện văn phong và cấu trúc mô tả task sau.

YÊU CẦU ĐỊNH DẠNG:
- KHÔNG dùng markdown (không dùng #, ##, **, etc.)
- Dùng dấu gạch ngang (-) cho danh sách
- Mỗi phần cách nhau bằng 1 dòng trống
- Cấu trúc rõ ràng: Mô tả → Yêu cầu chi tiết → Tiêu chí hoàn thành
- Ngắn gọn, súc tích, chuyên nghiệp
- Viết bằng tiếng Việt

Mô tả gốc:
${description}`;

        const result = await model.generateContent(prompt);
        const enhancedDescription = result.response.text();

        return new Response(
            JSON.stringify({ enhanced: enhancedDescription }),
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
