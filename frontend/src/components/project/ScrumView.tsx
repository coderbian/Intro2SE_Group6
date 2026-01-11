import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Plus, Calendar, TrendingUp, ArrowRight, Sparkles, StopCircle, FileText, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { TaskDialog } from './TaskDialog';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskCard } from './TaskCard';
import type { User, Project, Task, Sprint } from '../../types';
import { canEditTask } from '../../utils/permissions';

interface ScrumViewProps {
  user: User;
  project: Project;
  tasks: Task[];
  isManager: boolean;
  sprints?: Sprint[];
  currentSprint?: Sprint;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onAddAttachment: (taskId: string, file: { name: string; url: string; type: string }) => void;
  onCreateSprint?: (projectId: string, name: string, goal: string, taskIds: string[]) => void;
  onEndSprint?: (sprintId: string) => void;
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
  sprints,
  currentSprint,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
  onCreateSprint,
  onEndSprint,
}: ScrumViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createColumnStatus, setCreateColumnStatus] = useState<Task['status']>('todo');
  const [createMode, setCreateMode] = useState<"user-story" | "task">("user-story");
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [selectedBacklogTasks, setSelectedBacklogTasks] = useState<string[]>([]);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isEnhancingSprintGoal, setIsEnhancingSprintGoal] = useState(false);

  const handleEnhanceSprintGoal = async () => {
    if (!sprintGoal.trim()) return;
    setIsEnhancingSprintGoal(true);
    try {
      const { enhanceDescription } = await import('../../lib/aiService');
      const enhanced = await enhanceDescription(sprintGoal);
      setSprintGoal(enhanced);
    } catch (error) {
      console.error('AI enhance error:', error);
    } finally {
      setIsEnhancingSprintGoal(false);
    }
  };

  // Phân loại tasks
  const userStories = tasks.filter(t => t.type === 'user-story' || (!t.type && !t.parentTaskId));
  const sprintUserStories = userStories.filter(t => t.sprintId === currentSprint?.id);
  const backlogUserStories = userStories.filter(t => t.status === 'backlog' && !t.sprintId);

  // Standalone tasks (tasks độc lập không thuộc user story nào)
  const standaloneTasks = tasks.filter(t => t.type === 'task' && !t.parentTaskId);
  const backlogStandaloneTasks = standaloneTasks.filter(t => t.status === 'backlog' && !t.sprintId);
  const sprintStandaloneTasks = standaloneTasks.filter(t => t.sprintId === currentSprint?.id);

  // Backlog items = User Stories + Standalone Tasks
  const backlogItems = [...backlogUserStories, ...backlogStandaloneTasks];

  // Backward compatible - mainTasks = user stories (không có parent)
  const mainTasks = userStories;

  // Tasks trong Sprint Board:
  // 1. Sub-tasks của User Stories trong Sprint
  // 2. Standalone tasks được đưa vào Sprint
  // 3. User Stories không có child tasks (tính trực tiếp)
  const childTasksOfUserStories = tasks.filter(t =>
    t.type === 'task' && t.parentTaskId && sprintUserStories.some(us => us.id === t.parentTaskId)
  );
  const standaloneTasksInSprint = tasks.filter(t =>
    t.type === 'task' && !t.parentTaskId && t.sprintId === currentSprint?.id
  );
  // User Stories without children should be counted as "tasks" for progress
  const userStoriesWithoutChildren = sprintUserStories.filter(us =>
    !tasks.some(t => t.parentTaskId === us.id)
  );

  const sprintTasks = [...childTasksOfUserStories, ...standaloneTasksInSprint, ...userStoriesWithoutChildren];

  // Calculate sprint statistics
  // Total story points from User Stories in sprint
  const totalPoints = sprintUserStories.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  // A User Story is considered complete when ALL its child tasks are done
  const completedPoints = sprintUserStories.reduce((sum, story) => {
    const childTasks = tasks.filter(t => t.parentTaskId === story.id);
    const isComplete = childTasks.length === 0
      ? story.status === 'done'
      : childTasks.every(t => t.status === 'done');
    return sum + (isComplete ? (story.storyPoints || 0) : 0);
  }, 0);

  // Calculate progress based on task completion (all sprint tasks including standalone)
  const totalSprintTasks = sprintTasks.length;
  const completedSprintTasks = sprintTasks.filter(t => t.status === 'done').length;
  const sprintProgress = totalSprintTasks > 0 ? (completedSprintTasks / totalSprintTasks) * 100 : 0;

  const getDaysUntilDeadline = () => {
    if (!currentSprint?.endDate) return 0;
    const days = Math.ceil((new Date(currentSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleOpenCreate = (status: Task['status'], mode: "user-story" | "task" = "user-story", parentId?: string) => {
    setCreateColumnStatus(status);
    setCreateMode(mode);
    setCreateParentId(parentId);
    setIsCreateDialogOpen(true);
  };

  const handleLocalCreateSprint = () => {
    // Use the prop if available, otherwise just update status
    if (onCreateSprint) {
      onCreateSprint(project.id, sprintName, sprintGoal, selectedBacklogTasks);
    } else {
      // Fallback: just move tasks to todo
      selectedBacklogTasks.forEach((taskId) => {
        onUpdateTask(taskId, { status: 'todo' });
      });
    }

    setIsCreateSprintOpen(false);
    setSelectedBacklogTasks([]);
    setSprintName('');
    setSprintGoal('');
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', task.id);
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus && canEditTask(user.id, task, project)) {
      onUpdateTask(task.id, { status: newStatus });
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
                {currentSprint?.name || 'Chưa có Sprint'}
              </div>
              <div className="text-base text-gray-600 font-semibold mb-3">
                {currentSprint ? `${getDaysUntilDeadline()} ngày còn lại` : 'Tạo Sprint từ Backlog'}
              </div>
              {currentSprint && isManager && onEndSprint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEndSprint(currentSprint.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Kết thúc Sprint
                </Button>
              )}
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
                  {backlogUserStories.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-base">
                Lịch sử Sprint <Badge variant="secondary" className="ml-2">
                  {sprints?.filter(s => s.status === 'completed').length || 0}
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
                        {sprintTasks.filter(task => task.status === column.id).length}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 min-h-[300px] space-y-3 overflow-y-auto">
                    {sprintTasks
                      .filter(task => task.status === column.id)
                      .map((task) => {
                        const canDrag = canEditTask(user.id, task, project);
                        const parentStory = userStories.find(us => us.id === task.parentTaskId);
                        const isStandaloneTask = !task.parentTaskId;
                        return (
                          <div
                            key={task.id}
                            draggable={canDrag}
                            onDragStart={(e) => { if (canDrag) handleDragStart(e, task); }}
                            onClick={() => setSelectedTask(task)}
                            className={`cursor-pointer ${canDrag ? "cursor-move" : ""}`}
                          >
                            <div className={`bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${isStandaloneTask ? 'border-l-4 border-l-orange-400' : ''}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isStandaloneTask && (
                                    <Layers className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                  )}
                                  <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                                </div>
                              </div>
                              {parentStory && (
                                <p className="text-xs text-purple-600 mb-2">📋 {parentStory.title}</p>
                              )}
                              {isStandaloneTask && (
                                <p className="text-xs text-orange-500 mb-2">Task độc lập</p>
                              )}
                              {task.description && (
                                <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                              )}
                            </div>
                          </div>
                        )
                      }
                      )}

                    {sprintTasks.filter(task => task.status === column.id).length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-sm font-medium">Chưa có task</p>
                        <p className="text-xs mt-1">Thêm task từ User Stories bên dưới</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* User Stories trong Sprint với Progress */}
            {currentSprint && sprintUserStories.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📋</span> User Stories trong Sprint
                </h3>
                <div className="grid gap-4">
                  {sprintUserStories.map((story) => {
                    const storyTasks = tasks.filter(t => t.parentTaskId === story.id);
                    const doneTasks = storyTasks.filter(t => t.status === 'done').length;
                    const progress = storyTasks.length > 0 ? (doneTasks / storyTasks.length) * 100 : 0;

                    return (
                      <div
                        key={story.id}
                        className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedTask(story)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-gray-900">{story.title}</h4>
                            {story.storyPoints && (
                              <Badge variant="outline" className="text-purple-600 border-purple-300">
                                {story.storyPoints} pts
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`${story.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {story.status === 'done' ? '✅ Hoàn thành' : `${doneTasks}/${storyTasks.length} tasks`}
                            </Badge>
                            {isManager && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleOpenCreate('todo', 'task', story.id); }}
                                className="text-purple-600 border-purple-300 hover:bg-purple-50"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Thêm Task
                              </Button>
                            )}
                          </div>
                        </div>
                        {storyTasks.length > 0 && (
                          <div className="mt-3">
                            <Progress value={progress} className="h-2" />
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {storyTasks.map(task => (
                                <Badge
                                  key={task.id}
                                  variant="outline"
                                  className={`text-xs ${task.status === 'done' ? 'bg-green-50 text-green-700' : task.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-600'}`}
                                  onClick={() => setSelectedTask(task)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {task.title}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {storyTasks.length === 0 && (
                          <p className="text-sm text-gray-500 italic mt-2">Chưa có task. Click "Thêm Task" để tạo.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                      <>
                        <Button onClick={() => handleOpenCreate('backlog', 'user-story')} className="gap-2 px-6">
                          <FileText className="w-4 h-4" />
                          Tạo User Story
                        </Button>
                        <Button onClick={() => handleOpenCreate('backlog', 'task')} variant="outline" className="gap-2 px-6">
                          <Layers className="w-4 h-4" />
                          Tạo Task
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {backlogItems.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="mb-3">
                      <Plus className="w-16 h-16 mx-auto text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">Backlog trống</p>
                    <p className="text-sm">Tạo User Story hoặc Task để bắt đầu</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {backlogItems.map((task) => (
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
                          user={user}
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

          <TabsContent value="history" className="m-0 p-8">
            <Card className="shadow-sm border-2">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-xl font-bold">Lịch sử Sprint</CardTitle>
                <CardDescription className="text-base mt-1">
                  Các Sprint đã hoàn thành trước đó
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {(!sprints || sprints.filter(s => s.status === 'completed').length === 0) ? (
                  <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-lg font-medium mb-2">Chưa có Sprint nào hoàn thành</p>
                    <p className="text-sm">Các Sprint đã kết thúc sẽ xuất hiện ở đây</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sprints
                      .filter(s => s.status === 'completed')
                      .sort((a, b) => new Date(b.endDate || 0).getTime() - new Date(a.endDate || 0).getTime())
                      .map((sprint) => (
                        <div key={sprint.id} className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg text-gray-900">{sprint.name}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Hoàn thành
                            </Badge>
                          </div>
                          {sprint.goal && (
                            <p className="text-gray-600 text-sm mb-3">{sprint.goal}</p>
                          )}
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Bắt đầu: {new Date(sprint.startDate).toLocaleDateString('vi-VN')}</span>
                            {sprint.endDate && (
                              <span>Kết thúc: {new Date(sprint.endDate).toLocaleDateString('vi-VN')}</span>
                            )}
                          </div>
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
          mode={createMode}
          parentTaskId={createParentId}
          sprintId={currentSprint?.id}
          currentUserId={user.id}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="sprintGoal">Mục tiêu Sprint (tùy chọn)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEnhanceSprintGoal}
                  disabled={isEnhancingSprintGoal || !sprintGoal}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  {isEnhancingSprintGoal ? 'Đang xử lý...' : 'AI Cải thiện'}
                </Button>
              </div>
              <Textarea
                id="sprintGoal"
                placeholder="Mô tả mục tiêu chính của sprint này..."
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                rows={3}
                className="max-h-32 overflow-y-auto resize-none"
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Các items được chọn ({selectedBacklogTasks.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedBacklogTasks.map(taskId => {
                  const task = backlogItems.find(t => t.id === taskId);
                  const isUserStory = task?.type === 'user-story' || (!task?.type && !task?.parentTaskId);
                  return task ? (
                    <div key={taskId} className={`text-sm bg-white p-2 rounded border ${!isUserStory ? 'border-l-4 border-l-orange-400' : ''}`}>
                      <div className="flex items-center gap-2">
                        {isUserStory ? (
                          <FileText className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                        )}
                        <span className="font-medium">{task.title}</span>
                        {task.storyPoints && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {task.storyPoints} điểm
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-purple-900">Tổng Story Points:</span>
                  <span className="font-bold text-purple-600">
                    {selectedBacklogTasks.reduce((sum, taskId) => {
                      const task = backlogItems.find(t => t.id === taskId);
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
              onClick={handleLocalCreateSprint}
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
