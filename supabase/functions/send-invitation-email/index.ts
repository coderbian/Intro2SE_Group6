// Supabase Edge Function: Send Project Invitation Email
// Deploy with: supabase functions deploy send-invitation-email
// 
// NOTE: TypeScript errors about 'Deno' not found are NORMAL without Deno extension.
// These errors are editor-only and do NOT affect deployment or runtime.
// The function will deploy and run correctly on Supabase.
//
// To fix editor errors (optional):
// 1. Install Deno extension: denoland.vscode-deno
// 2. Reload VSCode: Ctrl+Shift+P → "Developer: Reload Window"
// See: supabase/functions/README.md for details

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  inviteeEmail: string;
  inviteeName: string;
  inviterName: string;
  projectName: string;
  projectId: string;
  invitationId: string;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const {
      inviteeEmail,
      inviteeName,
      inviterName,
      projectName,
      projectId,
      invitationId,
    }: InvitationEmailRequest = await req.json();

    // Validate email
    if (!inviteeEmail || !isValidEmail(inviteeEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!inviteeName || !inviterName || !projectName || !projectId || !invitationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create email content
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const acceptUrl = `${appUrl}/projects?action=accept&invitationId=${invitationId}`;
    const rejectUrl = `${appUrl}/projects?action=reject&invitationId=${invitationId}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lời mời tham gia dự án</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎉 Lời mời tham gia dự án
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                Xin chào <strong>${inviteeName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                <strong>${inviterName}</strong> đã mời bạn tham gia dự án 
                <strong style="color: #667eea;">${projectName}</strong>
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hãy chọn một trong các tùy chọn bên dưới để phản hồi lời mời:
              </p>
              
              <!-- Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 10px 0 0;">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      ✓ Đồng ý tham gia
                    </a>
                  </td>
                  <td align="center" style="padding: 0 0 0 10px;">
                    <a href="${rejectUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      ✗ Từ chối
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Hoặc bạn có thể trả lời lời mời này trong phần thông báo của ứng dụng.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Email này được gửi tự động từ hệ thống quản lý dự án
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Project Management System. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const emailText = `
Xin chào ${inviteeName},

${inviterName} đã mời bạn tham gia dự án "${projectName}"

Để chấp nhận lời mời, vui lòng truy cập: ${acceptUrl}
Để từ chối lời mời, vui lòng truy cập: ${rejectUrl}

Hoặc bạn có thể trả lời lời mời này trong phần thông báo của ứng dụng.

---
Email này được gửi tự động từ hệ thống quản lý dự án
© ${new Date().getFullYear()} Project Management System
    `.trim();

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Project Management <noreply@yourdomain.com>',
        to: [inviteeEmail],
        subject: `Lời mời tham gia dự án "${projectName}"`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        emailId: data.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-invitation-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
