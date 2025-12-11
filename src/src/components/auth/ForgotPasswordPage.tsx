import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!captcha) {
      newErrors.captcha = 'Vui lòng nhập mã captcha';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      toast.success('Mã xác thực đã được gửi đến email của bạn!');
      setStep('verify');
    }
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      setStep('reset');
    } else {
      toast.error('Mã xác thực không hợp lệ!');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'Mật khẩu không được để trống';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      toast.success('Đổi mật khẩu thành công!');
      setTimeout(() => onBack(), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            {step === 'email' && 'Quên mật khẩu'}
            {step === 'verify' && 'Xác thực tài khoản'}
            {step === 'reset' && 'Đặt lại mật khẩu'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'email' && 'Nhập email để nhận mã xác thực'}
            {step === 'verify' && 'Nhập mã xác thực 6 chữ số'}
            {step === 'reset' && 'Tạo mật khẩu mới cho tài khoản'}
          </CardDescription>
        </CardHeader>

        {step === 'email' && (
          <form onSubmit={handleSendCode}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email hoặc Số điện thoại</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="captcha">Mã Captcha</Label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-center select-none">
                    <span className="text-xl tracking-wider">AB7K9</span>
                  </div>
                </div>
                <Input
                  id="captcha"
                  type="text"
                  placeholder="Nhập mã captcha"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                />
                {errors.captcha && (
                  <p className="text-sm text-red-600">{errors.captcha}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Gửi mã xác thực
              </Button>
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </button>
            </CardFooter>
          </form>
        )}

        {step === 'verify' && (
          <div>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã xác thực</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500 text-center">
                  Demo: Nhập bất kỳ 6 chữ số nào
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button onClick={handleVerify} className="w-full">
                Xác nhận
              </Button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm text-blue-600 hover:underline"
              >
                Gửi lại mã
              </button>
            </CardFooter>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
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
                {errors.newPassword && (
                  <p className="text-sm text-red-600">{errors.newPassword}</p>
                )}
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
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Đổi mật khẩu
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
