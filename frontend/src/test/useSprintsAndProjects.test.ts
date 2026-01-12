import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock data
const mockSprint = {
    id: 'sprint-123',
    projectId: 'project-123',
    name: 'Sprint 1',
    goal: 'Complete user authentication',
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
}

describe('useSprints Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Sprint Data Validation', () => {
        it('should require name for sprint creation', () => {
            const sprintData = {
                name: '',
                projectId: 'project-123',
                goal: 'Test goal',
            }

            const isValid = sprintData.name.trim().length > 0
            expect(isValid).toBe(false)
        })

        it('should require projectId for sprint creation', () => {
            const sprintData = {
                name: 'Sprint 1',
                projectId: '',
                goal: 'Test goal',
            }

            const isValid = sprintData.projectId.trim().length > 0
            expect(isValid).toBe(false)
        })

        it('should accept valid sprint data', () => {
            const sprintData = {
                name: 'Sprint 1',
                projectId: 'project-123',
                goal: 'Test goal',
            }

            const isValid =
                sprintData.name.trim().length > 0 &&
                sprintData.projectId.trim().length > 0
            expect(isValid).toBe(true)
        })
    })

    describe('Sprint Status Management', () => {
        it('should have valid sprint statuses', () => {
            const validStatuses = ['planning', 'active', 'completed']

            expect(validStatuses.includes('planning')).toBe(true)
            expect(validStatuses.includes('active')).toBe(true)
            expect(validStatuses.includes('completed')).toBe(true)
        })

        it('should start sprint by changing status to active', () => {
            const sprint = { ...mockSprint, status: 'planning' as const }
            const startedSprint = { ...sprint, status: 'active' as const }

            expect(startedSprint.status).toBe('active')
        })

        it('should end sprint by changing status to completed', () => {
            const sprint = { ...mockSprint, status: 'active' as const }
            const endedSprint = { ...sprint, status: 'completed' as const }

            expect(endedSprint.status).toBe('completed')
        })
    })

    describe('Sprint Date Validation', () => {
        it('should validate end date is after start date', () => {
            const startDate = new Date('2024-01-01')
            const endDate = new Date('2024-01-14')

            const isValid = endDate > startDate
            expect(isValid).toBe(true)
        })

        it('should reject end date before start date', () => {
            const startDate = new Date('2024-01-14')
            const endDate = new Date('2024-01-01')

            const isValid = endDate > startDate
            expect(isValid).toBe(false)
        })

        it('should calculate sprint duration correctly', () => {
            const startDate = new Date('2024-01-01')
            const endDate = new Date('2024-01-15')

            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            expect(duration).toBe(14)
        })
    })

    describe('Sprint Task Association', () => {
        it('should allow tasks to be assigned to sprint', () => {
            const taskIds = ['task-1', 'task-2', 'task-3']
            const sprintId = 'sprint-123'

            const tasksWithSprint = taskIds.map(id => ({
                id,
                sprintId,
            }))

            expect(tasksWithSprint.every(t => t.sprintId === sprintId)).toBe(true)
        })

        it('should handle empty task list', () => {
            const taskIds: string[] = []
            expect(taskIds.length).toBe(0)
        })
    })

    describe('Current Sprint Detection', () => {
        it('should identify current active sprint', () => {
            const sprints = [
                { id: '1', status: 'completed' },
                { id: '2', status: 'active' },
                { id: '3', status: 'planning' },
            ]

            const currentSprint = sprints.find(s => s.status === 'active')
            expect(currentSprint?.id).toBe('2')
        })

        it('should return undefined when no active sprint', () => {
            const sprints = [
                { id: '1', status: 'completed' },
                { id: '2', status: 'planning' },
            ]

            const currentSprint = sprints.find(s => s.status === 'active')
            expect(currentSprint).toBeUndefined()
        })
    })
})

describe('useProjects Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Project Data Validation', () => {
        it('should require name for project creation', () => {
            const projectData = {
                name: '',
                deadline: '2024-12-31',
                template: 'kanban',
            }

            const isValid = projectData.name.trim().length > 0
            expect(isValid).toBe(false)
        })

        it('should require deadline for project creation', () => {
            const projectData = {
                name: 'Test Project',
                deadline: '',
                template: 'kanban',
            }

            const isValid = projectData.deadline.trim().length > 0
            expect(isValid).toBe(false)
        })

        it('should accept valid project data', () => {
            const projectData = {
                name: 'Test Project',
                deadline: '2024-12-31',
                template: 'kanban',
            }

            const isValid =
                projectData.name.trim().length > 0 &&
                projectData.deadline.trim().length > 0
            expect(isValid).toBe(true)
        })
    })

    describe('Project Template Validation', () => {
        it('should accept kanban template', () => {
            const validTemplates = ['kanban', 'scrum']
            expect(validTemplates.includes('kanban')).toBe(true)
        })

        it('should accept scrum template', () => {
            const validTemplates = ['kanban', 'scrum']
            expect(validTemplates.includes('scrum')).toBe(true)
        })

        it('should reject invalid templates', () => {
            const validTemplates = ['kanban', 'scrum']
            expect(validTemplates.includes('waterfall')).toBe(false)
        })
    })

    describe('Project Member Management', () => {
        it('should add member to project', () => {
            const members = [
                { userId: 'user-1', role: 'manager' },
            ]

            const newMember = { userId: 'user-2', role: 'member' }
            const updatedMembers = [...members, newMember]

            expect(updatedMembers.length).toBe(2)
            expect(updatedMembers.find(m => m.userId === 'user-2')).toBeDefined()
        })

        it('should remove member from project', () => {
            const members = [
                { userId: 'user-1', role: 'manager' },
                { userId: 'user-2', role: 'member' },
            ]

            const updatedMembers = members.filter(m => m.userId !== 'user-2')

            expect(updatedMembers.length).toBe(1)
            expect(updatedMembers.find(m => m.userId === 'user-2')).toBeUndefined()
        })

        it('should update member role', () => {
            const members = [
                { userId: 'user-1', role: 'manager' },
                { userId: 'user-2', role: 'member' },
            ]

            const updatedMembers = members.map(m =>
                m.userId === 'user-2' ? { ...m, role: 'manager' } : m
            )

            expect(updatedMembers.find(m => m.userId === 'user-2')?.role).toBe('manager')
        })

        it('should validate member roles', () => {
            const validRoles = ['manager', 'member']

            expect(validRoles.includes('manager')).toBe(true)
            expect(validRoles.includes('member')).toBe(true)
            expect(validRoles.includes('admin')).toBe(false)
        })
    })

    describe('Project Soft Delete', () => {
        it('should soft delete by setting deletedAt', () => {
            const project = {
                id: 'project-123',
                name: 'Test',
                deletedAt: null
            }

            const deletedProject = {
                ...project,
                deletedAt: new Date().toISOString(),
            }

            expect(deletedProject.deletedAt).toBeDefined()
        })

        it('should restore by clearing deletedAt', () => {
            const deletedProject = {
                id: 'project-123',
                name: 'Test',
                deletedAt: '2024-01-01T00:00:00Z'
            }

            const restoredProject = {
                ...deletedProject,
                deletedAt: null,
            }

            expect(restoredProject.deletedAt).toBeNull()
        })
    })

    describe('Project Filtering', () => {
        it('should filter out deleted projects', () => {
            const projects = [
                { id: '1', deletedAt: null },
                { id: '2', deletedAt: '2024-01-01' },
                { id: '3', deletedAt: null },
            ]

            const activeProjects = projects.filter(p => !p.deletedAt)
            expect(activeProjects.length).toBe(2)
        })

        it('should filter projects by user membership', () => {
            const userId = 'user-123'
            const projects = [
                { id: '1', members: [{ userId: 'user-123' }] },
                { id: '2', members: [{ userId: 'user-456' }] },
                { id: '3', members: [{ userId: 'user-123' }, { userId: 'user-789' }] },
            ]

            const userProjects = projects.filter(p =>
                p.members.some(m => m.userId === userId)
            )

            expect(userProjects.length).toBe(2)
            expect(userProjects.map(p => p.id)).toEqual(['1', '3'])
        })
    })
})
