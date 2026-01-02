// Supabase Edge Function: Estimate Time using Google Gemini
// Deploy with: supabase functions deploy estimate-time

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

        const { title, description } = await req.json();

        if (!title && !description) {
            return new Response(
                JSON.stringify({ error: "Title or description is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Bạn là chuyên gia ước tính thời gian hoàn thành công việc trong phát triển phần mềm.
Dựa vào tiêu đề và mô tả task sau, hãy ước tính số ngày cần để hoàn thành.
Chỉ trả về MỘT SỐ NGUYÊN duy nhất (số ngày), không giải thích gì thêm.
Số ngày tối thiểu là 1, tối đa là 30.

Tiêu đề: ${title || "(không có)"}
Mô tả: ${description || "(không có)"}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Parse the number, fallback to 5 if parsing fails
        let days = parseInt(responseText, 10);
        if (isNaN(days) || days < 1) days = 5;
        if (days > 30) days = 30;

        return new Response(
            JSON.stringify({ days }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
