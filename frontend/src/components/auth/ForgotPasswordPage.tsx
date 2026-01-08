import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const { handleResetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Logged-out screen: always light mode
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('dark');
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const ok = await handleResetPassword(email);
      if (ok) {
        toast.success('Đã gửi liên kết đặt lại mật khẩu! Vui lòng kiểm tra email.');
        setIsSent(true);
      }
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
            Quên mật khẩu
          </CardTitle>
          <CardDescription className="text-center">
            Nhập email để nhận liên kết đặt lại mật khẩu
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSendLink}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                disabled={isSent}
                />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
            {isSent && (
              <p className="text-sm text-muted-foreground">
                Nếu email tồn tại, bạn sẽ nhận được một liên kết đặt lại mật khẩu. Hãy mở email và bấm vào liên kết để tiếp tục.
              </p>
                )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
            {!isSent ? (
              <Button type="submit" className="w-full mt-2">
                Gửi liên kết đặt lại mật khẩu
              </Button>
            ) : (
              <Button type="button" className="w-full" onClick={onBack}>
                Về đăng nhập
              </Button>
            )}
            {!isSent && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </button>
            )}
            </CardFooter>
          </form>
      </Card>
    </div>
  );
}
