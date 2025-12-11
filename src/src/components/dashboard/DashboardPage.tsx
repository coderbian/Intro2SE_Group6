import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Plus, FolderKanban, CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import type { User, Project, Task } from '../../App';

interface DashboardPageProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  onSelectProject: (projectId: string) => void;
}

export function DashboardPage({
  user,
  projects,
  tasks,
  onSelectProject,
}: DashboardPageProps) {
  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.deadline) return false;
    return new Date(t.deadline) < new Date() && t.status !== 'done';
  }).length;

  const myTasks = tasks.filter(t => t.assignees.includes(user.id));
  const myInProgressTasks = myTasks.filter(t => t.status === 'in-progress');

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Khẩn cấp';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return priority;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2">Xin chào, {user.name}!</h1>
        <p className="text-gray-600">Đây là tổng quan về các dự án và nhiệm vụ của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Tổng dự án</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl">{projects.length}</div>
              <FolderKanban className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl">{completedTasks}</div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% tổng nhiệm vụ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Đang thực hiện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl">{inProgressTasks}</div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Trễ hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl">{overdueTasks}</div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dự án của tôi</CardTitle>
                  <CardDescription>Danh sách các dự án bạn đang tham gia</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Chưa có dự án nào</p>
                  <p className="text-sm text-gray-500">
                    Tạo dự án mới để bắt đầu quản lý công việc
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const progress = getProjectProgress(project.id);
                    const daysLeft = getDaysUntilDeadline(project.deadline);
                    const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;

                    return (
                      <div
                        key={project.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onSelectProject(project.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base">{project.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {project.template === 'kanban' ? 'Kanban' : 'Scrum'}
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-sm text-gray-600">{project.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tiến độ</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between mt-3 text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                              {projectTaskCount} nhiệm vụ
                            </span>
                            <span className="text-gray-600">
                              {project.members.length} thành viên
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {daysLeft > 0
                                ? `Còn ${daysLeft} ngày`
                                : daysLeft === 0
                                ? 'Hết hạn hôm nay'
                                : `Trễ ${Math.abs(daysLeft)} ngày`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Tasks */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nhiệm vụ của tôi</CardTitle>
              <CardDescription>Nhiệm vụ đang thực hiện</CardDescription>
            </CardHeader>
            <CardContent>
              {myInProgressTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Không có nhiệm vụ nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myInProgressTasks.slice(0, 5).map((task) => {
                    const project = projects.find(p => p.id === task.projectId);
                    
                    return (
                      <div key={task.id} className="border rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1">
                            <p className="text-sm mb-1">{task.title}</p>
                            {project && (
                              <p className="text-xs text-gray-500">{project.name}</p>
                            )}
                          </div>
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </div>
                        {task.deadline && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(task.deadline)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nhiệm vụ của tôi</span>
                <span className="text-sm">{myTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Đã hoàn thành</span>
                <span className="text-sm text-green-600">
                  {myTasks.filter(t => t.status === 'done').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Đang làm</span>
                <span className="text-sm text-yellow-600">
                  {myInProgressTasks.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tỷ lệ hoàn thành</span>
                <span className="text-sm">
                  {myTasks.length > 0
                    ? Math.round((myTasks.filter(t => t.status === 'done').length / myTasks.length) * 100)
                    : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
