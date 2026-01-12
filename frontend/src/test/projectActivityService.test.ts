import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActionLabel } from '../services/projectActivityService'

describe('Project Activity Service', () => {
    describe('getActionLabel', () => {
        it('should return correct label for task actions', () => {
            expect(getActionLabel('created', 'task')).toBe('đã tạo công việc')
            expect(getActionLabel('updated', 'task')).toBe('đã cập nhật công việc')
            expect(getActionLabel('deleted', 'task')).toBe('đã xóa công việc')
            expect(getActionLabel('status_changed', 'task')).toBe('đã thay đổi trạng thái')
            expect(getActionLabel('assigned', 'task')).toBe('đã giao công việc cho')
            expect(getActionLabel('comment_added', 'task')).toBe('đã bình luận về')
        })

        it('should return correct label for project actions', () => {
            expect(getActionLabel('created', 'project')).toBe('đã tạo dự án')
            expect(getActionLabel('updated', 'project')).toBe('đã cập nhật dự án')
            expect(getActionLabel('deleted', 'project')).toBe('đã xóa dự án')
        })

        it('should return correct label for member actions', () => {
            expect(getActionLabel('added', 'member')).toBe('đã thêm thành viên')
            expect(getActionLabel('removed', 'member')).toBe('đã xóa thành viên')
            expect(getActionLabel('role_changed', 'member')).toBe('đã thay đổi vai trò')
        })

        it('should return correct label for sprint actions', () => {
            expect(getActionLabel('created', 'sprint')).toBe('đã tạo sprint')
            expect(getActionLabel('started', 'sprint')).toBe('đã bắt đầu sprint')
            expect(getActionLabel('ended', 'sprint')).toBe('đã kết thúc sprint')
        })

        it('should return fallback for unknown action/entity combinations', () => {
            expect(getActionLabel('unknown_action', 'unknown_entity')).toBe('unknown_action unknown_entity')
        })
    })
})
