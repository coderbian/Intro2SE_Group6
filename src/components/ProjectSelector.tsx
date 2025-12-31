import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckSquare, Columns3, Calendar, LogOut } from 'lucide-react';

interface ProjectSelectorProps {
  user: { name: string; email: string };
  onSelectTemplate: (template: 'kanban' | 'scrum') => void;
  onLogout: () => void;
}

export function ProjectSelector({ user, onSelectTemplate, onLogout }: ProjectSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span>ProjectFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm">{user.name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="mb-4">Choose Your Project Template</h1>
          <p className="text-gray-600">
            Select a template that best fits your team's workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onSelectTemplate('kanban')}>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Columns3 className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-center">Kanban Board</CardTitle>
              <CardDescription className="text-center">
                Visualize your workflow and limit work in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Continuous flow of work</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Flexible and adaptable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Visual progress tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Great for ongoing projects</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => onSelectTemplate('kanban')}>
                Select Kanban
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onSelectTemplate('scrum')}>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 p-4 rounded-full">
                  <Calendar className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center">Scrum Board</CardTitle>
              <CardDescription className="text-center">
                Plan and deliver in time-boxed iterations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Sprint-based workflow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Backlog prioritization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Sprint planning & reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Ideal for fixed timelines</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => onSelectTemplate('scrum')}>
                Select Scrum
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
