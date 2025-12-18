import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Plus, Calendar, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
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
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [selectedBacklogTasks, setSelectedBacklogTasks] = useState<string[]>([]);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

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

  const handleCreateSprint = () => {
    // Move selected backlog tasks to "todo" status
    selectedBacklogTasks.forEach((taskId) => {
      onUpdateTask(taskId, { status: 'todo' });
    });
    
    setIsCreateSprintOpen(false);
    setSelectedBacklogTasks([]);
    setSprintName('');
    setSprintGoal('');
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      onUpdateTask(draggedTask.id, { status: newStatus });
    }
    setDraggedTask(null);
  };

  const toggleBacklogTaskSelection = (taskId: string) => {
    setSelectedBacklogTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sprint Stats */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border-b-2 px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          <Card className="border-2 border-blue-200 hover:shadow-2xl transition-all hover:scale-105 bg-white">
            <CardHeader className="pb-4 bg-gradient-to-br from-blue-50 to-white">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-blue-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                Sprint hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-black mb-2 text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Sprint 1
              </div>
              <div className="text-base text-gray-600 font-semibold">
                {getDaysUntilDeadline()} ngày còn lại
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 hover:shadow-2xl transition-all hover:scale-105 bg-white">
            <CardHeader className="pb-4 bg-gradient-to-br from-green-50 to-white">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-green-900">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                Tiến độ Sprint
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-black mb-4 text-gray-900">
                {Math.round(sprintProgress)}%
              </div>
              <Progress value={sprintProgress} className="h-4 bg-gray-200 shadow-inner" />
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 hover:shadow-2xl transition-all hover:scale-105 bg-white">
            <CardHeader className="pb-4 bg-gradient-to-br from-purple-50 to-white">
              <CardTitle className="text-lg font-bold text-purple-900">Story Points</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-black mb-2 text-gray-900">
                {completedPoints} <span className="text-2xl text-gray-400">/</span> {totalPoints}
              </div>
              <div className="text-base text-gray-600 font-semibold">Điểm hoàn thành</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="board" className="h-full">
          <div className="bg-white border-b px-8">
            <TabsList className="border-0">
              <TabsTrigger value="board" className="text-base">Bảng Sprint</TabsTrigger>
              <TabsTrigger value="backlog" className="text-base">
                Backlog <Badge variant="secondary" className="ml-2">
                  {mainTasks.filter(t => t.status === 'backlog').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="board" className="m-0 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sprintColumns.map((column) => (
                <div 
                  key={column.id} 
                  className="flex flex-col min-h-0 bg-white rounded-xl shadow-sm border"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id as Task['status'])}
                >
                  <div className={`${column.color} px-5 py-4 rounded-t-xl border-b`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-base">{column.title}</h3>
                      <Badge variant="secondary" className="bg-white/80 text-gray-700 font-semibold px-2.5 py-1">
                        {mainTasks.filter(task => task.status === column.id).length}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 min-h-[500px] space-y-3 overflow-y-auto">
                    {mainTasks
                      .filter(task => task.status === column.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className="cursor-move"
                        >
                          <TaskCard
                            task={task}
                            project={project}
                            allTasks={tasks}
                            onClick={() => setSelectedTask(task)}
                            showStoryPoints
                            onUpdateTask={onUpdateTask}
                          />
                        </div>
                      ))}
                    
                    {mainTasks.filter(task => task.status === column.id).length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-sm font-medium">Chưa có nhiệm vụ</p>
                      </div>
                    )}
                    
                    {isManager && (
                      <Button
                        variant="ghost"
                        className="w-full justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-2 border-dashed hover:border-blue-300 transition-all mt-3 py-6"
                        onClick={() => handleOpenCreate(column.id as Task['status'])}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Thêm nhiệm vụ
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="backlog" className="m-0 p-8">
            <Card className="shadow-sm border-2">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Product Backlog</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Quản lý danh sách công việc cho các sprint tương lai
                    </CardDescription>
                  </div>
                  <div className="flex gap-3">
                    {isManager && selectedBacklogTasks.length > 0 && (
                      <Button 
                        onClick={() => setIsCreateSprintOpen(true)} 
                        className="gap-2 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Sparkles className="w-4 h-4" />
                        Tạo Sprint ({selectedBacklogTasks.length})
                      </Button>
                    )}
                    {isManager && (
                      <Button onClick={() => handleOpenCreate('backlog')} className="gap-2 px-6">
                        <Plus className="w-4 h-4" />
                        Tạo User Story
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {mainTasks.filter(t => t.status === 'backlog').length === 0 ? (
                  <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="mb-3">
                      <Plus className="w-16 h-16 mx-auto text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">Chưa có user story nào trong backlog</p>
                    <p className="text-sm">Tạo user story mới để bắt đầu</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mainTasks
                      .filter(task => task.status === 'backlog')
                      .map((task) => (
                        <div 
                          key={task.id}
                          className={`relative ${selectedBacklogTasks.includes(task.id) ? 'ring-2 ring-purple-500 rounded-lg' : ''}`}
                          onClick={() => isManager && toggleBacklogTaskSelection(task.id)}
                        >
                          {isManager && (
                            <div className="absolute top-3 right-3 z-10">
                              <input
                                type="checkbox"
                                checked={selectedBacklogTasks.includes(task.id)}
                                onChange={() => toggleBacklogTaskSelection(task.id)}
                                className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                          <TaskCard
                            task={task}
                            project={project}
                            allTasks={tasks}
                            onClick={() => !isManager && setSelectedTask(task)}
                            showStoryPoints
                            onUpdateTask={onUpdateTask}
                          />
                        </div>
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

      {/* Create Sprint Dialog */}
      <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Tạo Sprint Mới
            </DialogTitle>
            <DialogDescription>
              Chuyển các user story đã chọn từ backlog sang sprint mới
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprintName">Tên Sprint (tùy chọn)</Label>
              <Input
                id="sprintName"
                placeholder="VD: Sprint 2"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprintGoal">Mục tiêu Sprint (tùy chọn)</Label>
              <Textarea
                id="sprintGoal"
                placeholder="Mô tả mục tiêu chính của sprint này..."
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                User Stories được chọn ({selectedBacklogTasks.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedBacklogTasks.map(taskId => {
                  const task = mainTasks.find(t => t.id === taskId);
                  return task ? (
                    <div key={taskId} className="text-sm bg-white p-2 rounded border">
                      <span className="font-medium">{task.title}</span>
                      {task.storyPoints && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {task.storyPoints} điểm
                        </Badge>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-purple-900">Tổng Story Points:</span>
                  <span className="font-bold text-purple-600">
                    {selectedBacklogTasks.reduce((sum, taskId) => {
                      const task = mainTasks.find(t => t.id === taskId);
                      return sum + (task?.storyPoints || 0);
                    }, 0)} điểm
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSprintOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreateSprint}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Tạo Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
