import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('apiRequest', () => {
  beforeEach(() => vi.resetModules())

  it('未配置管理 API 时拒绝请求', async () => {
    const { apiRequest } = await import('./client')
    await expect(apiRequest('/admin/v1/auth/me')).rejects.toMatchObject({
      code: 'ADMIN_API_NOT_CONFIGURED',
    })
  })
})
