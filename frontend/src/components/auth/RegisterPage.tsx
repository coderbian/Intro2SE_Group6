import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { UserPlus, Mail, Github, Eye, EyeOff, Loader2, XCircle, CheckCircle2, Info } from 'lucide-react';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { getSupabaseClient } from '../../lib/supabase-client';

interface RegisterPageProps {
  onRegister: (data: { email: string; password: string; name: string; phone?: string }) => void;
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const supabase = getSupabaseClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Password strength indicators
  const passwordChecks = {
    length: formData.password.length >= 6,
    hasNumber: /\d/.test(formData.password),
    hasLetter: /[a-zA-Z]/.test(formData.password),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  // Logged-out screen: always light mode
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('dark');
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Tên không được để trống';
    }

    if (!formData.email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onRegister({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || undefined,
        });
        setIsSubmitted(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleRegister = () => {
    if (typeof window === "undefined") return;
    supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: { redirectTo: new URL("/auth/callback", window.location.origin).toString() },
      })
      .then(({ error }) => {
        if (error) toast.error(error.message || "Không thể đăng ký với Google");
      })
      .catch(() => toast.error("Không thể đăng ký với Google"));
  };

  const handleGithubRegister = () => {
    if (typeof window === "undefined") return;
    supabase.auth
      .signInWithOAuth({
        provider: "github",
        options: { redirectTo: new URL("/auth/callback", window.location.origin).toString() },
      })
      .then(({ error }) => {
        if (error) toast.error(error.message || "Không thể đăng ký với GitHub");
      })
      .catch(() => toast.error("Không thể đăng ký với GitHub"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <Card className="w-full max-w-xl shadow-2xl border-0 backdrop-blur-sm bg-white/90 relative z-10">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Tạo tài khoản Planora
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Điền thông tin để bắt đầu quản lý dự án
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Email Confirmation Notice */}
            {isSubmitted && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex items-start gap-2">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Hãy kiểm tra email để xác nhận tài khoản trước khi đăng nhập.</span>
              </div>
            )}

            {/* Social Register Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-11 bg-white hover:bg-gray-50 border-gray-200 shadow-sm" onClick={handleGoogleRegister}>
                <Mail className="w-4 h-4 mr-2 text-red-500" />
                Google
              </Button>
              <Button type="button" variant="outline" className="h-11 bg-white hover:bg-gray-50 border-gray-200 shadow-sm" onClick={handleGithubRegister}>
                <Github className="w-4 h-4 mr-2 text-gray-800" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Hoặc đăng ký với email</span>
              </div>
            </div>

            {/* 2-Column Form Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Name Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`h-10 ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`h-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Phone Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Số điện thoại <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0987654321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`h-10 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tạo mật khẩu"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`h-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}

                  {/* Password Strength */}
                  {formData.password && (
                    <div className="space-y-1.5 mt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= level
                              ? passwordStrength === 1 ? 'bg-red-500'
                                : passwordStrength === 2 ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              : 'bg-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-2 text-[10px]">
                        <span className={passwordChecks.length ? 'text-green-600' : 'text-gray-400'}>
                          {passwordChecks.length ? '✓' : '○'} 6+ ký tự
                        </span>
                        <span className={passwordChecks.hasLetter ? 'text-green-600' : 'text-gray-400'}>
                          {passwordChecks.hasLetter ? '✓' : '○'} Chữ cái
                        </span>
                        <span className={passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                          {passwordChecks.hasNumber ? '✓' : '○'} Số
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`h-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Mật khẩu khớp
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all hover:shadow-xl font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Đăng ký
                </>
              )}
            </Button>
            <div className="text-sm text-center text-gray-600">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium transition-colors"
              >
                Đăng nhập
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
