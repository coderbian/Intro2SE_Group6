"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { exportToExcel, exportToPDF } from "../../services/exportService"
import { toast } from "sonner"
import type { Project, Task } from "../../types"

interface ExportReportDialogProps {
    project: Project
    tasks: Task[]
    trigger?: React.ReactNode
}

export function ExportReportDialog({ project, tasks, trigger }: ExportReportDialogProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null)
    const [open, setOpen] = useState(false)

    const handleExport = async (type: 'excel' | 'pdf') => {
        try {
            setExportType(type)
            setIsExporting(true)

            // Simulate small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500))

            if (type === 'excel') {
                exportToExcel({ project, tasks })
                toast.success('Đã xuất báo cáo Excel thành công!')
            } else {
                exportToPDF({ project, tasks })
                toast.success('Đã xuất báo cáo PDF thành công!')
            }

            setOpen(false)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Có lỗi xảy ra khi xuất báo cáo')
        } finally {
            setIsExporting(false)
            setExportType(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Xuất báo cáo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-600" />
                        Xuất báo cáo dự án
                    </DialogTitle>
                    <DialogDescription>
                        Chọn định dạng tệp để xuất báo cáo tiến độ và công việc của dự án
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Excel Option */}
                    <button
                        onClick={() => handleExport('excel')}
                        disabled={isExporting}
                        className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isExporting && exportType === 'excel' ? (
                            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
                        )}
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">Excel</div>
                            <div className="text-xs text-gray-500">.xlsx</div>
                        </div>
                    </button>

                    {/* PDF Option */}
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                        className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isExporting && exportType === 'pdf' ? (
                            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                        ) : (
                            <FileText className="w-12 h-12 text-red-600 group-hover:scale-110 transition-transform" />
                        )}
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">PDF</div>
                            <div className="text-xs text-gray-500">.pdf</div>
                        </div>
                    </button>
                </div>

                <div className="text-xs text-gray-500 text-center border-t pt-4">
                    <p className="font-medium mb-1">Nội dung báo cáo bao gồm:</p>
                    <p>Thông tin dự án • Thống kê công việc • Danh sách nhiệm vụ • Thành viên</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
