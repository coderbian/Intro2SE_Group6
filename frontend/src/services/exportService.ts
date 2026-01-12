import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, Task } from '../types';

interface ExportData {
    project: Project;
    tasks: Task[];
}

/**
 * Remove Vietnamese diacritics for PDF compatibility
 */
function removeDiacritics(str: string): string {
    const map: Record<string, string> = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
        'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
        'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
        'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
        'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
        'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
        'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
        'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
        'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
        'Đ': 'D',
    };
    return str.split('').map(char => map[char] || char).join('');
}

// Labels for Excel (with Vietnamese)
const STATUS_LABELS: Record<string, string> = {
    'backlog': 'Backlog',
    'todo': 'Chờ làm',
    'in_progress': 'Đang làm',
    'in-progress': 'Đang làm',
    'review': 'Review',
    'done': 'Hoàn thành',
    'completed': 'Hoàn thành',
};

const PRIORITY_LABELS: Record<string, string> = {
    'low': 'Thấp',
    'medium': 'Trung bình',
    'high': 'Cao',
    'urgent': 'Khẩn cấp',
};

// Labels for PDF (without diacritics)
const STATUS_LABELS_PDF: Record<string, string> = {
    'backlog': 'Backlog',
    'todo': 'Cho lam',
    'in_progress': 'Dang lam',
    'in-progress': 'Dang lam',
    'review': 'Review',
    'done': 'Hoan thanh',
    'completed': 'Hoan thanh',
};

const PRIORITY_LABELS_PDF: Record<string, string> = {
    'low': 'Thap',
    'medium': 'Trung binh',
    'high': 'Cao',
    'urgent': 'Khan cap',
};

/**
 * Calculate project statistics
 */
function calculateStats(tasks: Task[]) {
    const activeTasks = tasks.filter(t => !t.deletedAt);
    const total = activeTasks.length;
    const completed = activeTasks.filter(t => {
        const status = t.status as string;
        return status === 'done' || status === 'completed';
    }).length;
    const inProgress = activeTasks.filter(t => {
        const status = t.status as string;
        return status === 'in-progress' || status === 'in_progress';
    }).length;
    const overdue = activeTasks.filter(t => {
        if (!t.dueDate) return false;
        const status = t.status as string;
        return new Date(t.dueDate) < new Date() && status !== 'done' && status !== 'completed';
    }).length;

    return {
        total,
        completed,
        inProgress,
        todo: activeTasks.filter(t => t.status === 'todo' || t.status === 'backlog').length,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
}

/**
 * Export project data to Excel file
 */
export function exportToExcel({ project, tasks }: ExportData): void {
    const activeTasks = tasks.filter(t => !t.deletedAt);
    const stats = calculateStats(tasks);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng quan dự án
    const overviewData = [
        ['BÁO CÁO DỰ ÁN'],
        [],
        ['Tên dự án:', project.name],
        ['Mô tả:', project.description || 'Không có'],
        ['Template:', project.template === 'kanban' ? 'Kanban' : 'Scrum'],
        ['Ngày tạo:', new Date(project.createdAt).toLocaleDateString('vi-VN')],
        ['Deadline:', new Date(project.deadline).toLocaleDateString('vi-VN')],
        ['Số thành viên:', project.members.length],
        [],
        ['THỐNG KÊ CÔNG VIỆC'],
        [],
        ['Tổng số công việc:', stats.total],
        ['Hoàn thành:', stats.completed],
        ['Đang làm:', stats.inProgress],
        ['Chờ làm:', stats.todo],
        ['Quá hạn:', stats.overdue],
        ['Tỷ lệ hoàn thành:', `${stats.completionRate}%`],
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

    // Sheet 2: Danh sách công việc
    const taskHeaders = ['STT', 'Tiêu đề', 'Trạng thái', 'Độ ưu tiên', 'Người thực hiện', 'Ngày hạn', 'Story Points'];
    const taskRows = activeTasks.map((task, index) => {
        const assigneeNames = task.assignees
            .map(id => project.members.find(m => m.userId === id)?.name || 'Unknown')
            .join(', ') || 'Chưa giao';

        return [
            index + 1,
            task.title,
            STATUS_LABELS[task.status] || task.status,
            PRIORITY_LABELS[task.priority] || task.priority,
            assigneeNames,
            task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có',
            task.storyPoints || 0,
        ];
    });
    const wsTasksData = [taskHeaders, ...taskRows];
    const wsTasks = XLSX.utils.aoa_to_sheet(wsTasksData);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Công việc');

    // Sheet 3: Thành viên
    const memberHeaders = ['STT', 'Họ tên', 'Email', 'Vai trò'];
    const memberRows = project.members.map((member, index) => [
        index + 1,
        member.name,
        member.email || 'N/A',
        member.role === 'manager' ? 'Quản lý' : 'Thành viên',
    ]);
    const wsMembersData = [memberHeaders, ...memberRows];
    const wsMembers = XLSX.utils.aoa_to_sheet(wsMembersData);
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Thành viên');

    // Sheet 4: Thống kê theo trạng thái
    const statusStats = ['backlog', 'todo', 'in-progress', 'done'].map(status => {
        const count = activeTasks.filter(t => t.status === status).length;
        return [STATUS_LABELS[status] || status, count];
    });
    const wsStatusData = [['Trạng thái', 'Số lượng'], ...statusStats];
    const wsStatus = XLSX.utils.aoa_to_sheet(wsStatusData);
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Thống kê');

    // Generate and download file
    const filename = `BaoCao_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
}

/**
 * Export project data to PDF file
 */
export function exportToPDF({ project, tasks }: ExportData): void {
    const activeTasks = tasks.filter(t => !t.deletedAt);
    const stats = calculateStats(tasks);

    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BAO CAO DU AN', pageWidth / 2, 20, { align: 'center' });

    // Project name
    doc.setFontSize(16);
    doc.text(removeDiacritics(project.name), pageWidth / 2, 30, { align: 'center' });

    // Report date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const formatDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    doc.text(`Ngay xuat: ${formatDate(new Date())}`, pageWidth / 2, 38, { align: 'center' });

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);

    // Project Info Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('THONG TIN DU AN', 14, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const projectInfo = [
        `Mo ta: ${removeDiacritics(project.description || 'Khong co')}`,
        `Template: ${project.template === 'kanban' ? 'Kanban' : 'Scrum'}`,
        `Ngay tao: ${formatDate(new Date(project.createdAt))}`,
        `Deadline: ${formatDate(new Date(project.deadline))}`,
        `So thanh vien: ${project.members.length}`,
    ];
    let y = 60;
    projectInfo.forEach(info => {
        doc.text(info, 14, y);
        y += 6;
    });

    // Statistics Section
    y += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('THONG KE CONG VIEC', 14, y);
    y += 8;

    // Stats table
    autoTable(doc, {
        startY: y,
        head: [['Chi tieu', 'Gia tri']],
        body: [
            ['Tong so cong viec', stats.total.toString()],
            ['Hoan thanh', stats.completed.toString()],
            ['Dang lam', stats.inProgress.toString()],
            ['Cho lam', stats.todo.toString()],
            ['Qua han', stats.overdue.toString()],
            ['Ty le hoan thanh', `${stats.completionRate}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        tableWidth: 80,
    });

    // Get the y position after the table
    y = (doc as any).lastAutoTable.finalY + 10;

    // Tasks Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DANH SACH CONG VIEC', 14, y);
    y += 5;

    // Tasks table
    const taskTableData = activeTasks.slice(0, 20).map((task, index) => {
        const assigneeNames = task.assignees
            .map(id => {
                const member = project.members.find(m => m.userId === id);
                return member ? removeDiacritics(member.name) : '?';
            })
            .join(', ') || 'Chua giao';

        return [
            (index + 1).toString(),
            removeDiacritics(task.title.substring(0, 30) + (task.title.length > 30 ? '...' : '')),
            STATUS_LABELS_PDF[task.status] || task.status,
            PRIORITY_LABELS_PDF[task.priority] || task.priority,
            assigneeNames.substring(0, 15),
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['#', 'Tieu de', 'Trang thai', 'Uu tien', 'Nguoi thuc hien']],
        body: taskTableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 60 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 40 },
        },
    });

    if (activeTasks.length > 20) {
        y = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`... va ${activeTasks.length - 20} cong viec khac`, 14, y);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Trang ${i} / ${pageCount} - Planora Report`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save file
    const filename = `BaoCao_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}
