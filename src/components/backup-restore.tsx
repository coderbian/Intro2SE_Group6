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
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">Planora</h1>
        </div>

        <nav className="flex-1 py-6">
          <ul className="space-y-1 px-3">
            <li>
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Giám sát hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Users className="h-5 w-5" />
                <span>Quản lý người dùng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Shield className="h-5 w-5" />
                <span>Quản lý vai trò</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-5 w-5" />
                <span>Cấu hình hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('backup')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
              >
                <Database className="h-5 w-5" />
                <span>Backup/Restore</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>{adminUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">{adminUsername}</div>
                  <div className="text-xs text-muted-foreground">{displayEmail}</div>
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
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Sao lưu và Phục hồi dữ liệu</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Backup Card */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Tạo bản sao lưu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Lần sao lưu cuối cùng: <span className="font-medium text-foreground">15/11/2025 - 10:30 AM</span>
                  </p>
                </div>
                <Button 
                  onClick={handleBackup}
                  className="w-full h-12"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Tạo bản sao lưu ngay
                </Button>
              </CardContent>
            </Card>

            {/* Restore from Backup Card */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Phục hồi từ bản sao lưu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      {selectedFile ? (
                        <FileCheck className="w-12 h-12 text-green-500" />
                      ) : (
                        <Upload className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground">
                          Kéo và thả file vào đây hoặc nhấp để chọn
                        </p>
                        <p className="text-xs text-muted-foreground">Chỉ chấp nhận file .zip</p>
                      </>
                    )}
                  </div>
                </div>

                <label htmlFor="backup-file">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Tải lên file (.zip)
                    </span>
                  </Button>
                </label>

                {selectedFile && (
                  <Button 
                    onClick={handleRestore}
                    className="w-full"
                  >
                    Phục hồi dữ liệu
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
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
