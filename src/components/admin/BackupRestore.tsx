"use client"

import { useState } from "react"
import { Settings, Users, Shield, LayoutDashboard, Database, LogOut, Download, Upload, FileCheck, User, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BackupRestoreProps {
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onExitAdmin?: () => void // Added onExitAdmin prop
  adminEmail?: string // Added adminEmail prop
  onLogout?: () => void // Added onLogout prop
}

export function BackupRestore({ onNavigate, onExitAdmin, adminEmail, onLogout }: BackupRestoreProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const adminUsername = adminEmail ? adminEmail.split('@')[0] : 'admin'
  const displayEmail = adminEmail || 'admin@gmail.com'

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].name.endsWith('.zip')) {
      setSelectedFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleBackup = () => {
    console.log("[v0] Creating backup...")
    // Backup logic here
  }

  const handleRestore = () => {
    if (selectedFile) {
      console.log("[v0] Restoring from:", selectedFile.name)
      // Restore logic here
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-[52px] flex items-center px-4 border-b border-border">
          <h1 className="text-lg font-bold text-primary">Planora Admin</h1>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            <li>
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Giám sát hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Users className="h-4 w-4" />
                <span>Quản lý người dùng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Shield className="h-4 w-4" />
                <span>Quản lý vai trò</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>Cấu hình hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('backup')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
              >
                <Database className="h-4 w-4" />
                <span>Backup/Restore</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback className="text-xs">{adminUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-xs font-medium text-foreground">{adminUsername}</div>
                  <div className="text-[11px] text-muted-foreground">{displayEmail}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 lg:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Sao lưu và Phục hồi dữ liệu
                </h1>
                <p className="text-gray-600 text-sm">Quản lý sao lưu và khôi phục dữ liệu hệ thống</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Create Backup Card */}
            <Card className="border shadow-md bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Tạo bản sao lưu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">
                    Lần sao lưu cuối cùng: <span className="font-medium text-foreground">15/11/2025 - 10:30 AM</span>
                  </p>
                </div>
                <Button 
                  onClick={handleBackup}
                  className="w-full h-10"
                  size="default"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Tạo bản sao lưu ngay
                </Button>
              </CardContent>
            </Card>

            {/* Restore from Backup Card */}
            <Card className="border shadow-md bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Phục hồi từ bản sao lưu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-accent"
                      : "border-border bg-muted hover:border-muted-foreground"
                  }`}
                >
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="backup-file"
                  />
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      {selectedFile ? (
                        <FileCheck className="w-10 h-10 text-green-500" />
                      ) : (
                        <Upload className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-foreground">
                          Kéo và thả file vào đây hoặc nhấp để chọn
                        </p>
                        <p className="text-[11px] text-muted-foreground">Chỉ chấp nhận file .zip</p>
                      </>
                    )}
                  </div>
                </div>

                <label htmlFor="backup-file">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9"
                    asChild
                  >
                    <span>
                      <Upload className="w-3.5 h-3.5 mr-2" />
                      Tải lên file (.zip)
                    </span>
                  </Button>
                </label>

                {selectedFile && (
                  <Button 
                    onClick={handleRestore}
                    className="w-full h-9"
                  >
                    Phục hồi dữ liệu
                  </Button>
                )}

                <p className="text-[11px] text-muted-foreground text-center">
                  Chỉ chấp nhận các file sao lưu hợp lệ do hệ thống tạo ra.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}