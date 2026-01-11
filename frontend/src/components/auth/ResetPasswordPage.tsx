import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { KeyRound, Eye, EyeOff, Lock, CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase-client";

export function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const navigate = useNavigate();

  const [isReady, setIsReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength indicators
  const passwordChecks = {
    length: newPassword.length >= 6,
    hasNumber: /\d/.test(newPassword),
    hasLetter: /[a-zA-Z]/.test(newPassword),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/90 relative z-10">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-4 rounded-2xl shadow-lg">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Liên kết không hợp lệ
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Liên kết đặt lại mật khẩu đã hết hạn hoặc không đúng. Vui lòng yêu cầu lại.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-3 pt-4">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              onClick={() => navigate("/forgot-password", { replace: true })}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Yêu cầu liên kết mới
            </Button>
            <Button
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50"
              onClick={() => navigate("/login", { replace: true })}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về đăng nhập
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/90 relative z-10">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Đặt lại mật khẩu
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Tạo mật khẩu mới an toàn cho tài khoản của bạn
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`pr-10 h-11 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {errors.newPassword}
                </p>
              )}

              {/* Password Strength Indicators */}
              {newPassword && (
                <div className="space-y-2 mt-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength >= level
                            ? passwordStrength === 1 ? 'bg-red-500'
                              : passwordStrength === 2 ? 'bg-yellow-500'
                                : 'bg-green-500'
                            : 'bg-gray-200'
                          }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`flex items-center gap-1 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordChecks.length ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      6+ ký tự
                    </span>
                    <span className={`flex items-center gap-1 ${passwordChecks.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordChecks.hasLetter ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      Có chữ cái
                    </span>
                    <span className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                      {passwordChecks.hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      Có số
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Xác nhận mật khẩu
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-10 h-11 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Mật khẩu khớp
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all hover:shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-900"
              onClick={() => navigate("/login", { replace: true })}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại đăng nhập
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
