import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isLoading, user, role } = useApp();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    navigate("/projects", { replace: true });
  }, [isLoading, navigate, role, user]);

  return null;
}


