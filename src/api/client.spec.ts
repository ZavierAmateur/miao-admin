import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('apiRequest', () => {
  beforeEach(() => vi.resetModules())

  it('同源请求固定携带 Cookie 和请求 ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      timestamp: 1,
      requestId: 'request-1',
      data: { ok: true },
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { apiRequest } = await import('./client')
    await expect(apiRequest('/admin/v1/auth/me')).resolves.toEqual({ ok: true })
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe('/admin/v1/auth/me')
    expect(options.credentials).toBe('include')
    expect((options.headers as Headers).get('X-Request-Id')).toBeTruthy()
  })
})
