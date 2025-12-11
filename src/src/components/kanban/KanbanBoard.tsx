import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CheckSquare, Plus, LogOut, Settings2, MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface User {
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done';
}

interface KanbanBoardProps {
  user: User;
  onLogout: () => void;
  onChangeTemplate: () => void;
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Design landing page',
    description: 'Create mockups for the new landing page',
    priority: 'high',
    assignee: 'John Doe',
    status: 'in-progress',
  },
  {
    id: '2',
    title: 'Setup database',
    description: 'Configure PostgreSQL database',
    priority: 'high',
    assignee: 'Jane Smith',
    status: 'done',
  },
  {
    id: '3',
    title: 'Implement authentication',
    description: 'Add login and registration functionality',
    priority: 'medium',
    assignee: 'John Doe',
    status: 'todo',
  },
  {
    id: '4',
    title: 'Write documentation',
    description: 'Document API endpoints',
    priority: 'low',
    assignee: 'Jane Smith',
    status: 'backlog',
  },
];

export function KanbanBoard({ user, onLogout, onChangeTemplate }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    assignee: user.name,
    status: 'todo',
  });

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
    { id: 'todo', title: 'To Do', color: 'bg-blue-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' },
  ];

  const handleCreateTask = () => {
    if (newTask.title && newTask.description) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority as 'low' | 'medium' | 'high',
        assignee: newTask.assignee || user.name,
        status: newTask.status as 'backlog' | 'todo' | 'in-progress' | 'done',
      };
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignee: user.name,
        status: 'todo',
      });
      setIsDialogOpen(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span>Kanban Board</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your kanban board
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Enter task description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value as 'low' | 'medium' | 'high' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Column</Label>
                    <Select
                      value={newTask.status}
                      onValueChange={(value) => setNewTask({ ...newTask, status: value as Task['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={onChangeTemplate}>
              <Settings2 className="w-4 h-4 mr-2" />
              Change Template
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} p-4 rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  <Badge variant="secondary">
                    {tasks.filter(task => task.status === column.id).length}
                  </Badge>
                </div>
              </div>
              <div className="bg-white border border-t-0 rounded-b-lg p-4 min-h-[500px] space-y-3">
                {tasks
                  .filter(task => task.status === column.id)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          <span className="text-sm">{task.title}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {columns
                              .filter(col => col.id !== task.status)
                              .map((col) => (
                                <DropdownMenuItem
                                  key={col.id}
                                  onClick={() => handleMoveTask(task.id, col.id as Task['status'])}
                                >
                                  Move to {col.title}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">{task.assignee}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
