import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { LayoutDashboard } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase-client";

export function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const navigate = useNavigate();

  const [isReady, setIsReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Logged-out screen: always light mode
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    async function init() {
      // Give Supabase a chance to parse the recovery tokens from the URL/hash
      const { data } = await supabase.auth.getSession();
      setHasRecoverySession(!!data.session);
      setIsReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setHasRecoverySession(!!session);
      });
      unsub = sub.subscription;
    }

    init();

    return () => {
      unsub?.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!newPassword) {
      nextErrors.newPassword = "Mật khẩu không được để trống";
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message || "Không thể đặt lại mật khẩu");
        return;
      }

      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Reset password failed:", err);
      toast.error("Không thể đặt lại mật khẩu");
    }
  };

  if (!isReady) return null;

  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Liên kết không hợp lệ</CardTitle>
            <CardDescription className="text-center">
              Liên kết đặt lại mật khẩu đã hết hạn hoặc không đúng. Vui lòng yêu cầu lại.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" onClick={() => navigate("/forgot-password", { replace: true })}>
              Yêu cầu liên kết mới
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login", { replace: true })}>
              Về đăng nhập
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-center">Tạo mật khẩu mới cho tài khoản của bạn</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Đổi mật khẩu
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


