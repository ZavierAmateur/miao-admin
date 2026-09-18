import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth'

describe('auth store', () => {
  beforeEach(() => setActivePinia(createPinia()))

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
})
