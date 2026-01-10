import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { getSupabaseClient } from "../../lib/supabase-client";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isLoading, user, role } = useApp();
  const [roleChecked, setRoleChecked] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const checkRoleAndNavigate = async () => {
      if (isLoading) return;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      // If role is already loaded from context, use it
      if (role !== null) {
        if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/projects", { replace: true });
        }
        return;
      }

      // For OAuth logins, role might not be loaded yet
      // Fetch it directly from database
      if (!roleChecked) {
        setRoleChecked(true);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.warn('Failed to fetch role:', error);
            navigate("/projects", { replace: true });
            return;
          }

          const dbRole = data?.role?.toLowerCase();
          if (dbRole === 'admin') {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/projects", { replace: true });
          }
        } catch (error) {
          console.error('Error checking role:', error);
          navigate("/projects", { replace: true });
        }
      }
    };

    checkRoleAndNavigate();
  }, [isLoading, navigate, role, user, roleChecked, supabase]);

  return null;
}


