"use client"

import { useState } from "react"
import App from "@/src/App"
import { AdminDashboard, RoleManagement, SystemMonitoring, SystemSettings, BackupRestore } from "@/src/components/admin"
import { toast } from "sonner"

export default function Page() {
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'users' | 'roles' | 'settings' | 'backup'>('dashboard')

  const handleAdminLogin = (email: string, password: string) => {
    console.log("Page: handleAdminLogin called", { email, password })
    if (email.includes("@gmail.com") && password.length >= 6) {
      console.log("Page: admin credentials accepted")
      setAdminEmail(email)
      setIsAdminMode(true)
      toast.success("Đăng nhập quản trị viên thành công!")
    } else {
      console.log("Page: admin credentials rejected")
      toast.error("Thông tin đăng nhập quản trị viên không chính xác!")
    }
  }


  const handleLogout = () => {
    setIsAdminMode(false)
    window.dispatchEvent(new CustomEvent("logout"))
    toast.success("Đã đăng xuất")
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SystemMonitoring adminEmail={adminEmail} onNavigate={setCurrentPage} onLogout={handleLogout} />
      case 'users':
        return <AdminDashboard adminEmail={adminEmail} onNavigate={setCurrentPage} onLogout={handleLogout} />
      case 'roles':
        return <RoleManagement adminEmail={adminEmail} onNavigate={setCurrentPage} onLogout={handleLogout} />
      case 'settings':
        return <SystemSettings adminEmail={adminEmail} onNavigate={setCurrentPage} onLogout={handleLogout} />
      case 'backup':
        return <BackupRestore adminEmail={adminEmail} onNavigate={setCurrentPage} onLogout={handleLogout} />
      default:
        return <SystemMonitoring adminEmail={adminEmail} onNavigate={setCurrentPage} onLogout={handleLogout} />
    }
  }

  if (isAdminMode) {
    return renderPage()
  }

  console.log("Page: rendering App, passing onEnterAdmin", { hasHandler: !!handleAdminLogin })
  // Expose a fallback global handler in case the prop isn't forwarded correctly
  try {
    // @ts-ignore
    window.__onEnterAdmin = handleAdminLogin
  } catch (e) {
    // ignore (server or non-window environment)
  }

  return <App onEnterAdmin={handleAdminLogin} />
}
