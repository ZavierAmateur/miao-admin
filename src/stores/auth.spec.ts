import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as adminAuthApi from '../api/adminAuth'
import { useAuthStore } from './auth'

vi.mock('../api/adminAuth', () => ({
  getCurrentAdmin: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('按服务端返回的权限判断页面能力', () => {
    const store = useAuthStore()
    store.setIdentity({ id: 'admin-1', displayName: '测试运营', role: 'operator', permissions: ['player:read'] })
    expect(store.isAuthenticated).toBe(true)
    expect(store.hasPermission('player:read')).toBe(true)
    expect(store.hasPermission('player:ban')).toBe(false)
  })

  it('退出后清空权限', () => {
    const store = useAuthStore()
    store.setIdentity({ id: 'admin-1', displayName: '测试管理员', role: 'admin', permissions: ['audit:read'] })
    store.setIdentity(null)
    expect(store.isAuthenticated).toBe(false)
    expect(store.hasPermission('audit:read')).toBe(false)
  })

  it('服务暂时不可用时保留会话重试能力', async () => {
    const store = useAuthStore()
    vi.mocked(adminAuthApi.getCurrentAdmin).mockRejectedValueOnce(new Error('service unavailable'))

    await expect(store.restoreSession()).rejects.toThrow('service unavailable')
    expect(store.sessionChecked).toBe(false)

    vi.mocked(adminAuthApi.getCurrentAdmin).mockResolvedValueOnce({
      identity: { id: 'admin-1', displayName: '测试管理员', role: 'admin', permissions: ['player:read'] },
      expiresAt: 100,
    })
    await expect(store.restoreSession()).resolves.toBeUndefined()
    expect(store.isAuthenticated).toBe(true)
  })
})
