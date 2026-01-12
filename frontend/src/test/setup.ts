import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('../lib/supabase-client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                    order: vi.fn(() => ({
                        limit: vi.fn(),
                    })),
                })),
                in: vi.fn(() => ({
                    order: vi.fn(),
                })),
                order: vi.fn(() => ({
                    limit: vi.fn(),
                })),
                is: vi.fn(() => ({
                    order: vi.fn(() => ({
                        limit: vi.fn(),
                    })),
                })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(),
            })),
        })),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } })),
                remove: vi.fn(),
            })),
        },
        channel: vi.fn(() => ({
            on: vi.fn(() => ({
                subscribe: vi.fn(),
            })),
        })),
        removeChannel: vi.fn(),
    },
    getSupabaseClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
            insert: vi.fn(),
        })),
    })),
}))

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}))

// Mock uuid
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'test-uuid-1234'),
}))
