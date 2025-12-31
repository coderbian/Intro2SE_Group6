"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { LayoutDashboard, Mail, Github, Facebook, ShieldCheck } from 'lucide-react'
import { Separator } from "../ui/separator"
import { toast } from "sonner"

interface LoginPageProps {
  onLogin: (email: string, password: string) => void
  onAdminLogin?: (email: string, password: string) => void
  onSwitchToRegister: () => void
  onForgotPassword: () => void
}

export function LoginPage({ onLogin, onAdminLogin, onSwitchToRegister, onForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isAdminMode, setIsAdminMode] = useState(false)

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = "Email không được để trống"
    } else if (isAdminMode) {
      if (!email.includes("@gmail.com")) {
        newErrors.email = "Email phải có đuôi @gmail.com"
      }
      if (!password) {
        newErrors.password = "Mật khẩu không được để trống"
      } else if (password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
      }
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ"
    }

    if (!isAdminMode) {
      if (!password) {
        newErrors.password = "Mật khẩu không được để trống"
      } else if (password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
      }
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.email) {
        toast.error(newErrors.email)
      }
      if (newErrors.password) {
        toast.error(newErrors.password)
      }
    }
    
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      console.log("LoginPage: submit", { isAdminMode, email })
      if (isAdminMode) {
        if (onAdminLogin) {
          console.log("LoginPage: calling onAdminLogin", { email, password })
          onAdminLogin(email, password)
        } else if (typeof window !== "undefined" && (window as any).__onEnterAdmin) {
          console.log("LoginPage: calling fallback window.__onEnterAdmin", { email })
          ;(window as any).__onEnterAdmin(email, password)
        } else {
          console.warn("LoginPage: onAdminLogin is not provided and no fallback found")
          toast.error("Không có handler đăng nhập quản trị viên")
        }
      } else {
        console.log("LoginPage: calling onLogin", { email, password })
        onLogin(email, password)
      }
    }
  }

  const handleGoogleLogin = () => {
    const loginEmail = "demo@gmail.com"
    toast.success("Đã liên kết tài khoản Google thành công")
    const settings = JSON.parse(localStorage.getItem("planora_settings") || "{}")
    settings.linkedAccounts = settings.linkedAccounts || {}
    settings.linkedAccounts.google = {
      email: loginEmail,
      linkedAt: new Date().toISOString(),
    }
    localStorage.setItem("planora_settings", JSON.stringify(settings))
    onLogin(loginEmail, "google-oauth-token")
  }

  const handleFacebookLogin = () => {
    const loginEmail = "demo@facebook.com"
    toast.success("Đã liên kết tài khoản Facebook thành công")
    const settings = JSON.parse(localStorage.getItem("planora_settings") || "{}")
    settings.linkedAccounts = settings.linkedAccounts || {}
    settings.linkedAccounts.facebook = {
      email: loginEmail,
      linkedAt: new Date().toISOString(),
    }
    localStorage.setItem("planora_settings", JSON.stringify(settings))
    onLogin(loginEmail, "facebook-oauth-token")
  }

  const handleGithubLogin = () => {
    const loginEmail = "demo@github.com"
    toast.success("Đã liên kết tài khoản GitHub thành công")
    const settings = JSON.parse(localStorage.getItem("planora_settings") || "{}")
    settings.linkedAccounts = settings.linkedAccounts || {}
    settings.linkedAccounts.github = {
      email: loginEmail,
      linkedAt: new Date().toISOString(),
    }
    localStorage.setItem("planora_settings", JSON.stringify(settings))
    onLogin(loginEmail, "github-oauth-token")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className={`${isAdminMode ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'} p-3 rounded-xl`}>
              {isAdminMode ? (
                <ShieldCheck className="w-8 h-8 text-white" />
              ) : (
                <LayoutDashboard className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            {isAdminMode ? "Quản trị viên Planora" : "Chào mừng đến Planora"}
          </CardTitle>
          <CardDescription className="text-center">
            {isAdminMode ? "Đăng nhập với tài khoản quản trị viên" : "Đăng nhập để tiếp tục quản lý dự án"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isAdminMode && (
              <>
                <div className="space-y-2">
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin}>
                    <Mail className="w-4 h-4 mr-2 text-red-500" />
                    Đăng nhập với Google
                  </Button>

                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleFacebookLogin}>
                    <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                    Đăng nhập với Facebook
                  </Button>

                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleGithubLogin}>
                    <Github className="w-4 h-4 mr-2 text-gray-800" />
                    Đăng nhập với GitHub
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Hoặc</span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email hoặc Tên tài khoản</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onForgotPassword} className="text-sm text-blue-600 hover:underline">
                Quên mật khẩu?
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold border border-red-700 shadow-md">
              Đăng nhập
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => {
                setIsAdminMode(!isAdminMode)
                setEmail("")
                setPassword("")
                setErrors({})
              }}
            >
              {isAdminMode ? (
                <>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Đăng nhập với tài khoản người dùng
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Đăng nhập với tài khoản quản trị viên
                </>
              )}
            </Button>

            {!isAdminMode && (
              <div className="text-sm text-center text-gray-600">
                Chưa có tài khoản?{" "}
                <button type="button" onClick={onSwitchToRegister} className="text-blue-600 hover:underline">
                  Đăng ký ngay
                </button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
