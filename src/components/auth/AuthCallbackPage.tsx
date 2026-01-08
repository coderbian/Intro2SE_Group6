import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabaseClient } from "../../lib/supabase-client";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for Supabase to process the OAuth callback
        // The session should be automatically extracted from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          navigate("/login", { replace: true });
          return;
        }

        if (!session) {
          // No session found, redirect to login
          console.log("No session found after OAuth callback");
          navigate("/login", { replace: true });
          return;
        }

        // Check user role from database
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        const role = userData?.role || "user";

        console.log("OAuth login successful, redirecting...", { role });

        // Navigate based on role
        if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        navigate("/login", { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    // Small delay to ensure URL hash is available
    const timeoutId = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timeoutId);
  }, [navigate, supabase]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return null;
}
