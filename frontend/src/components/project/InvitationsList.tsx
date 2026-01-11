"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { toast } from "sonner"
import { Check, X, Bell } from "lucide-react"
import { getSupabaseClient } from "../../lib/supabase-client"

export function InvitationsList() {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Lấy danh sách lời mời
  const fetchInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Lấy các lời mời có status = 'pending' của user hiện tại
    const { data, error } = await supabase
      .from('join_requests')
      .select(`
        id,
        created_at,
        project:projects (name) 
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (data) setInvites(data)
  }

  useEffect(() => {
    fetchInvites()
  }, [])

  // 2. Xử lý Chấp nhận
  const handleAccept = async (requestId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.rpc('accept_join_request_by_id' as any, {
        p_request_id: requestId
      })

      if (error) throw error

      toast.success("Đã tham gia dự án thành công!")
      fetchInvites() // Load lại để ẩn lời mời đi
      // Tùy chọn: Reload trang để cập nhật danh sách dự án bên sidebar
      setTimeout(() => window.location.reload(), 1000) 

    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  // 3. Xử lý Từ chối
  const handleReject = async (requestId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.rpc('reject_join_request_by_id' as any, { 
        p_request_id: requestId 
      })
      
      if (error) throw error

      toast.info("Đã từ chối lời mời")
      fetchInvites()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (invites.length === 0) return null // Nếu không có lời mời thì ẩn luôn

  return (
    <div className="mb-6 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-lg text-gray-800">Lời mời tham gia dự án</h3>
      </div>
      
      <div className="grid gap-3">
        {invites.map((invite) => (
          <Card key={invite.id} className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  Bạn được mời tham gia: <span className="font-bold text-blue-700">{invite.project?.name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Nhận ngày: {new Date(invite.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleReject(invite.id)}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-1" /> Từ chối
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleAccept(invite.id)}
                  disabled={loading}
                >
                  <Check className="w-4 h-4 mr-1" /> Chấp nhận
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}