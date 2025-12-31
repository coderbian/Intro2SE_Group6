"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  CheckSquare,
  Plus,
  LogOut,
  Settings2,
  MoreVertical,
  Trash2,
  Calendar,
  TrendingUp,
  GripVertical,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Progress } from "../ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

interface User {
  name: string
  email: string
}

interface Story {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  storyPoints: number
  assignee: string
  status: "backlog" | "sprint" | "in-progress" | "done"
}

interface ScrumBoardProps {
  user: User
  onLogout: () => void
  onChangeTemplate: () => void
}

const initialStories: Story[] = [
  {
    id: "1",
    title: "User Authentication",
    description: "As a user, I want to login so that I can access my account",
    priority: "high",
    storyPoints: 8,
    assignee: "John Doe",
    status: "in-progress",
  },
  {
    id: "2",
    title: "Dashboard UI",
    description: "As a user, I want to see a dashboard with my projects",
    priority: "high",
    storyPoints: 13,
    assignee: "Jane Smith",
    status: "sprint",
  },
  {
    id: "3",
    title: "Email Notifications",
    description: "As a user, I want to receive email notifications for updates",
    priority: "medium",
    storyPoints: 5,
    assignee: "John Doe",
    status: "done",
  },
  {
    id: "4",
    title: "Dark Mode",
    description: "As a user, I want to switch to dark mode for better viewing",
    priority: "low",
    storyPoints: 3,
    assignee: "Jane Smith",
    status: "backlog",
  },
  {
    id: "5",
    title: "Export Reports",
    description: "As a user, I want to export reports in PDF format",
    priority: "medium",
    storyPoints: 8,
    assignee: "John Doe",
    status: "backlog",
  },
]

export function ScrumBoard({ user, onLogout, onChangeTemplate }: ScrumBoardProps) {
  const [stories, setStories] = useState<Story[]>(initialStories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sprintName] = useState("Sprint 1")
  const [sprintDaysLeft] = useState(5)
  const [draggedStory, setDraggedStory] = useState<Story | null>(null)
  const [newStory, setNewStory] = useState<Partial<Story>>({
    title: "",
    description: "",
    priority: "medium",
    storyPoints: 5,
    assignee: user.name,
    status: "backlog",
  })

  const handleCreateStory = () => {
    if (newStory.title && newStory.description) {
      const story: Story = {
        id: Date.now().toString(),
        title: newStory.title,
        description: newStory.description,
        priority: newStory.priority as "low" | "medium" | "high",
        storyPoints: newStory.storyPoints || 5,
        assignee: newStory.assignee || user.name,
        status: newStory.status as "backlog" | "sprint" | "in-progress" | "done",
      }
      setStories([...stories, story])
      setNewStory({
        title: "",
        description: "",
        priority: "medium",
        storyPoints: 5,
        assignee: user.name,
        status: "backlog",
      })
      setIsDialogOpen(false)
    }
  }

  const handleDeleteStory = (storyId: string) => {
    setStories(stories.filter((story) => story.id !== storyId))
  }

  const handleMoveStory = (storyId: string, newStatus: Story["status"]) => {
    setStories(stories.map((story) => (story.id === storyId ? { ...story, status: newStatus } : story)))
  }

  const handleDragStart = (story: Story) => {
    setDraggedStory(story)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (newStatus: Story["status"]) => {
    if (draggedStory) {
      handleMoveStory(draggedStory.id, newStatus)
      setDraggedStory(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const sprintStories = stories.filter(
    (s) => s.status === "sprint" || s.status === "in-progress" || s.status === "done",
  )
  const totalSprintPoints = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0)
  const completedPoints = stories.filter((s) => s.status === "done").reduce((sum, s) => sum + s.storyPoints, 0)
  const sprintProgress = totalSprintPoints > 0 ? (completedPoints / totalSprintPoints) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span>Scrum Board</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create User Story</DialogTitle>
                  <DialogDescription>Add a new user story to your backlog</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newStory.title}
                      onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                      placeholder="Enter story title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newStory.description}
                      onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                      placeholder="As a [user], I want to [action]..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newStory.priority}
                        onValueChange={(value) =>
                          setNewStory({ ...newStory, priority: value as "low" | "medium" | "high" })
                        }
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
                      <Label htmlFor="storyPoints">Story Points</Label>
                      <Select
                        value={newStory.storyPoints?.toString()}
                        onValueChange={(value) => setNewStory({ ...newStory, storyPoints: Number.parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="13">13</SelectItem>
                          <SelectItem value="21">21</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStory}>Create</Button>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Current Sprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">{sprintName}</div>
              <div className="text-sm text-gray-600">{sprintDaysLeft} days remaining</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" />
                Sprint Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-2">{Math.round(sprintProgress)}%</div>
              <Progress value={sprintProgress} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">Story Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">
                {completedPoints} / {totalSprintPoints}
              </div>
              <div className="text-sm text-gray-600">Completed points</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="board" className="space-y-6">
          <TabsList>
            <TabsTrigger value="board">Sprint Board</TabsTrigger>
            <TabsTrigger value="backlog">Backlog</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: "sprint", title: "To Do", color: "bg-blue-100" },
                { id: "in-progress", title: "In Progress", color: "bg-yellow-100" },
                { id: "done", title: "Done", color: "bg-green-100" },
              ].map((column) => (
                <div key={column.id} className="flex flex-col">
                  <div className={`${column.color} p-4 rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <span>{column.title}</span>
                      <Badge variant="secondary">{stories.filter((story) => story.status === column.id).length}</Badge>
                    </div>
                  </div>
                  <div
                    className="bg-white border border-t-0 rounded-b-lg p-4 min-h-[500px] space-y-3"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(column.id as Story["status"])}
                  >
                    {stories
                      .filter((story) => story.status === column.id)
                      .map((story) => (
                        <div
                          key={story.id}
                          draggable
                          onDragStart={() => handleDragStart(story)}
                          className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move ${
                            draggedStory?.id === story.id ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2 justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(story.priority)}`} />
                              <span className="text-sm">{story.title}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {column.id !== "sprint" && (
                                  <DropdownMenuItem onClick={() => handleMoveStory(story.id, "sprint")}>
                                    Move to To Do
                                  </DropdownMenuItem>
                                )}
                                {column.id !== "in-progress" && (
                                  <DropdownMenuItem onClick={() => handleMoveStory(story.id, "in-progress")}>
                                    Move to In Progress
                                  </DropdownMenuItem>
                                )}
                                {column.id !== "done" && (
                                  <DropdownMenuItem onClick={() => handleMoveStory(story.id, "done")}>
                                    Move to Done
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleMoveStory(story.id, "backlog")}>
                                  Move to Backlog
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteStory(story.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {story.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {story.storyPoints} pts
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">{story.assignee}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="backlog" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle>Product Backlog</CardTitle>
                <CardDescription>Prioritize and manage user stories for future sprints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stories
                    .filter((story) => story.status === "backlog")
                    .map((story) => (
                      <div key={story.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(story.priority)}`} />
                            <span className="text-sm">{story.title}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleMoveStory(story.id, "sprint")}>
                                Add to Sprint
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteStory(story.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {story.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {story.storyPoints} pts
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">{story.assignee}</span>
                        </div>
                      </div>
                    ))}
                  {stories.filter((story) => story.status === "backlog").length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p>No stories in backlog</p>
                      <p className="text-sm">Create a new story to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
