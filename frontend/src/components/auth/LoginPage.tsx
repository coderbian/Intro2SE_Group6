"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { LayoutDashboard, Mail, Github, Eye, EyeOff, LogIn, Loader2, XCircle } from 'lucide-react'
import { Separator } from "../ui/separator"
import { toast } from "sonner"
import { getSupabaseClient } from "../../lib/supabase-client"

interface LoginPageProps {
  onLogin: (email: string, password: string) => void | Promise<void>
  onSwitchToRegister: () => void
  onForgotPassword: () => void
}

export function LoginPage({ onLogin, onSwitchToRegister, onForgotPassword }: LoginPageProps) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Logged-out screens should not inherit a previous user's theme.
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return
    document.documentElement.classList.remove("dark")
  }, [])

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = "Email không được để trống"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ"
    }

    if (!password) {
      newErrors.password = "Mật khẩu không được để trống"
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitting(true)
      try {
        await onLogin(email, password)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleGoogleLogin = () => {
    if (typeof window === "undefined") return

    supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/auth/callback", window.location.origin).toString(),
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error(error.message || "Không thể đăng nhập với Google")
        }
      })
      .catch((err) => {
        console.error("Google OAuth sign-in failed:", err)
        toast.error("Không thể đăng nhập với Google")
      })
  }

  const handleGithubLogin = () => {
    if (typeof window === "undefined") return

    supabase.auth
      .signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: new URL("/auth/callback", window.location.origin).toString(),
        },
      })
      .then(({ error }) => {
        if (error) {
          toast.error(error.message || "Không thể đăng nhập với GitHub")
        }
      })
      .catch((err) => {
        console.error("GitHub OAuth sign-in failed:", err)
        toast.error("Không thể đăng nhập với GitHub")
      })
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
            <div className="rounded-2xl shadow-lg transform hover:scale-105 transition-transform overflow-hidden">
              <img src="/logo.png" alt="Planora Logo" className="w-20 h-20 object-cover" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Chào mừng đến với Planora
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Đăng nhập để tiếp tục quản lý dự án
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                onClick={handleGoogleLogin}
              >
                <Mail className="w-4 h-4 mr-2 text-red-500" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                onClick={handleGithubLogin}
              >
                <Github className="w-4 h-4 mr-2 text-gray-800" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Hoặc đăng nhập với email</span>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-11 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-11 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all hover:shadow-xl font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng nhập
                </>
              )}
            </Button>

            <div className="text-sm text-center text-gray-600">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors"
              >
                Đăng ký ngay
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
