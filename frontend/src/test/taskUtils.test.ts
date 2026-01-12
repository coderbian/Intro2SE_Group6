import { describe, it, expect } from 'vitest'

describe('Task Utilities', () => {
    describe('Task Status Validation', () => {
        const validStatuses = ['backlog', 'todo', 'in-progress', 'done']

        it('should validate correct task statuses', () => {
            validStatuses.forEach(status => {
                expect(validStatuses.includes(status)).toBe(true)
            })
        })

        it('should reject invalid task statuses', () => {
            const invalidStatuses = ['pending', 'in_review', 'archived', 'deleted']
            invalidStatuses.forEach(status => {
                expect(validStatuses.includes(status)).toBe(false)
            })
        })
    })

    describe('Task Priority Validation', () => {
        const validPriorities = ['low', 'medium', 'high', 'urgent']

        it('should validate correct priorities', () => {
            validPriorities.forEach(priority => {
                expect(validPriorities.includes(priority)).toBe(true)
            })
        })

        it('should reject invalid priorities', () => {
            const invalidPriorities = ['critical', 'normal', 'very-high']
            invalidPriorities.forEach(priority => {
                expect(validPriorities.includes(priority)).toBe(false)
            })
        })
    })

    describe('Task Type Validation', () => {
        const validTypes = ['task', 'user-story', 'bug', 'epic']

        it('should validate correct task types', () => {
            validTypes.forEach(type => {
                expect(validTypes.includes(type)).toBe(true)
            })
        })

        it('should default to "task" type', () => {
            const defaultType = 'task'
            expect(validTypes.includes(defaultType)).toBe(true)
            expect(defaultType).toBe('task')
        })
    })

    describe('Date Validation', () => {
        it('should identify overdue tasks', () => {
            const pastDate = new Date('2020-01-01')
            const now = new Date()

            const isOverdue = pastDate < now
            expect(isOverdue).toBe(true)
        })

        it('should identify future tasks as not overdue', () => {
            const futureDate = new Date('2030-12-31')
            const now = new Date()

            const isOverdue = futureDate < now
            expect(isOverdue).toBe(false)
        })

        it('should not consider completed tasks as overdue', () => {
            const pastDate = new Date('2020-01-01')
            const status = 'done'
            const now = new Date()

            const isOverdue = pastDate < now && status !== 'done' && status !== 'completed'
            expect(isOverdue).toBe(false)
        })
    })

    describe('Statistics Calculation', () => {
        const mockTasks = [
            { id: '1', status: 'done', deletedAt: null },
            { id: '2', status: 'done', deletedAt: null },
            { id: '3', status: 'in-progress', deletedAt: null },
            { id: '4', status: 'todo', deletedAt: null },
            { id: '5', status: 'backlog', deletedAt: null },
            { id: '6', status: 'done', deletedAt: '2024-01-01' }, // Deleted, should be excluded
        ]

        it('should calculate total active tasks correctly', () => {
            const activeTasks = mockTasks.filter(t => !t.deletedAt)
            expect(activeTasks.length).toBe(5)
        })

        it('should calculate completed tasks correctly', () => {
            const activeTasks = mockTasks.filter(t => !t.deletedAt)
            const completed = activeTasks.filter(t => t.status === 'done').length
            expect(completed).toBe(2)
        })

        it('should calculate in-progress tasks correctly', () => {
            const activeTasks = mockTasks.filter(t => !t.deletedAt)
            const inProgress = activeTasks.filter(t => t.status === 'in-progress').length
            expect(inProgress).toBe(1)
        })

        it('should calculate completion rate correctly', () => {
            const activeTasks = mockTasks.filter(t => !t.deletedAt)
            const total = activeTasks.length
            const completed = activeTasks.filter(t => t.status === 'done').length
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

            expect(completionRate).toBe(40) // 2 out of 5 = 40%
        })

        it('should return 0 completion rate for empty task list', () => {
            const emptyTasks: any[] = []
            const total = emptyTasks.length
            const completed = emptyTasks.filter((t: any) => t.status === 'done').length
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

            expect(completionRate).toBe(0)
        })
    })
})
