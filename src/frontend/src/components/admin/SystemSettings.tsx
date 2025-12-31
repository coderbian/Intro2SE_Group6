"use client"

import { useState } from "react"
import { Settings, Users, Shield, Database, LogOut, LayoutDashboard, Mail, HardDrive, User, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SystemSettingsProps {
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onExitAdmin?: () => void
  adminEmail?: string
  onLogout?: () => void
}

export function SystemSettings({ onNavigate, onExitAdmin, adminEmail, onLogout }: SystemSettingsProps) {
  const [activeNav, setActiveNav] = useState("settings")
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    host: "smtp.sendgrid.net",
    port: "587",
    username: "apikey",
    password: ""
  })

  // Limit settings state
  const [limitSettings, setLimitSettings] = useState({
    maxFileSize: "10",
    maxProjectsPerPM: "5"
  })

  const handleSendTestEmail = () => {
    alert("Äang gá»­i email kiá»ƒm tra...")
  }

  const handleSaveChanges = () => {
    alert("ÄÃ£ lÆ°u thay Ä‘á»•i thÃ nh cÃ´ng!")
  }

  const adminUsername = adminEmail ? adminEmail.split('@')[0] : 'admin'
  const displayEmail = adminEmail || 'admin@gmail.com'

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
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
                <span>GiÃ¡m sÃ¡t há»‡ thá»‘ng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Users className="h-4 w-4" />
                <span>Quáº£n lÃ½ ngÆ°á»i dÃ¹ng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Shield className="h-4 w-4" />
                <span>Quáº£n lÃ½ vai trÃ²</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
              >
                <Settings className="h-4 w-4" />
                <span>Cáº¥u hÃ¬nh há»‡ thá»‘ng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('backup')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                <span>CÃ i Ä‘áº·t</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>ÄÄƒng xuáº¥t</span>
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
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Cáº¥u hÃ¬nh há»‡ thá»‘ng
                </h1>
                <p className="text-gray-600 text-sm">Thiáº¿t láº­p vÃ  cáº¥u hÃ¬nh cÃ¡c tham sá»‘ há»‡ thá»‘ng</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-5 max-w-4xl pb-20">
            {/* Email Settings Card */}
            <Card className="border shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-5 h-5" />
                  CÃ i Ä‘áº·t Email (SMTP/SendGrid)
                </CardTitle>
                <CardDescription>
                  Cáº¥u hÃ¬nh mÃ¡y chá»§ email Ä‘á»ƒ gá»­i thÃ´ng bÃ¡o vÃ  email há»‡ thá»‘ng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      placeholder="smtp.sendgrid.net"
                      value={emailSettings.host}
                      onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      placeholder="587"
                      value={emailSettings.port}
                      onChange={(e) => setEmailSettings({ ...emailSettings, port: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="apikey"
                    value={emailSettings.username}
                    onChange={(e) => setEmailSettings({ ...emailSettings, username: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Máº­t kháº©u</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings({ ...emailSettings, password: e.target.value })}
                  />
                </div>
                
                <Button variant="outline" onClick={handleSendTestEmail}>
                  Gá»­i email kiá»ƒm tra
                </Button>
              </CardContent>
            </Card>

            {/* Limit Settings Card */}
            <Card className="border shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <HardDrive className="w-5 h-5" />
                  CÃ i Ä‘áº·t giá»›i háº¡n
                </CardTitle>
                <CardDescription>
                  Thiáº¿t láº­p cÃ¡c giá»›i háº¡n cho há»‡ thá»‘ng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">KÃ­ch thÆ°á»›c file upload tá»‘i Ä‘a (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={limitSettings.maxFileSize}
                    onChange={(e) => setLimitSettings({ ...limitSettings, maxFileSize: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxProjects">Sá»‘ dá»± Ã¡n tá»‘i Ä‘a má»—i Project Manager</Label>
                  <Input
                    id="maxProjects"
                    type="number"
                    min="1"
                    placeholder="5"
                    value={limitSettings.maxProjectsPerPM}
                    onChange={(e) => setLimitSettings({ ...limitSettings, maxProjectsPerPM: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed Save Button */}
          <div className="fixed bottom-8 right-8">
            <Button size="lg" onClick={handleSaveChanges} className="shadow-lg">
              LÆ°u thay Ä‘á»•i
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
