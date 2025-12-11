import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TaskDialog } from './TaskDialog';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskCard } from './TaskCard';
import type { User, Project, Task } from '../../App';

interface ScrumViewProps {
  user: User;
  project: Project;
  tasks: Task[];
  isManager: boolean;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onAddAttachment: (taskId: string, file: { name: string; url: string; type: string }) => void;
}

const sprintColumns = [
  { id: 'todo', title: 'Cần làm', color: 'bg-blue-100' },
  { id: 'in-progress', title: 'Đang làm', color: 'bg-yellow-100' },
  { id: 'done', title: 'Hoàn thành', color: 'bg-green-100' },
];

export function ScrumView({
  user,
  project,
  tasks,
  isManager,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
}: ScrumViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createColumnStatus, setCreateColumnStatus] = useState<Task['status']>('todo');

  // Filter out subtasks
  const mainTasks = tasks.filter(t => !t.parentTaskId);

  // Calculate sprint statistics
  const sprintTasks = mainTasks.filter(t => t.status !== 'backlog');
  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = mainTasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const sprintProgress = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

  const getDaysUntilDeadline = () => {
    const days = Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleOpenCreate = (status: Task['status']) => {
    setCreateColumnStatus(status);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sprint Stats */}
      <div className="bg-white border-b px-6 py-4">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Sprint hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">Sprint 1</div>
              <div className="text-sm text-gray-600">
                {getDaysUntilDeadline()} ngày còn lại
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" />
                Tiến độ Sprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-2">{Math.round(sprintProgress)}%</div>
              <Progress value={sprintProgress} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Story Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">
                {completedPoints} / {totalPoints}
              </div>
              <div className="text-sm text-gray-600">Điểm hoàn thành</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="board" className="h-full">
          <div className="bg-white border-b px-6">
            <TabsList className="border-0">
              <TabsTrigger value="board">Bảng Sprint</TabsTrigger>
              <TabsTrigger value="backlog">
                Backlog ({mainTasks.filter(t => t.status === 'backlog').length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="board" className="m-0 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sprintColumns.map((column) => (
                <div key={column.id} className="flex flex-col">
                  <div className={`${column.color} p-4 rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <span>{column.title}</span>
                      <Badge variant="secondary">
                        {mainTasks.filter(task => task.status === column.id).length}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-white border border-t-0 rounded-b-lg p-4 min-h-[500px] space-y-3">
                    {mainTasks
                      .filter(task => task.status === column.id)
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          allTasks={tasks}
                          onClick={() => setSelectedTask(task)}
                          showStoryPoints
                        />
                      ))}
                    
                    {isManager && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-500"
                        onClick={() => handleOpenCreate(column.id as Task['status'])}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm nhiệm vụ
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="backlog" className="m-0 p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Backlog</CardTitle>
                    <CardDescription>
                      Quản lý danh sách công việc cho các sprint tương lai
                    </CardDescription>
                  </div>
                  {isManager && (
                    <Button onClick={() => handleOpenCreate('backlog')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tạo User Story
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {mainTasks.filter(t => t.status === 'backlog').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Chưa có user story nào trong backlog</p>
                    <p className="text-sm mt-2">Tạo user story mới để bắt đầu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mainTasks
                      .filter(task => task.status === 'backlog')
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          allTasks={tasks}
                          onClick={() => setSelectedTask(task)}
                          showStoryPoints
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          project={project}
          user={user}
          allTasks={tasks}
          isManager={isManager}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onCreateTask={onCreateTask}
          onAddComment={onAddComment}
          onAddAttachment={onAddAttachment}
        />
      )}

      {isCreateDialogOpen && (
        <CreateTaskDialog
          project={project}
          initialStatus={createColumnStatus}
          isScrum
          onClose={() => setIsCreateDialogOpen(false)}
          onCreateTask={(task) => {
            onCreateTask(task);
            setIsCreateDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
