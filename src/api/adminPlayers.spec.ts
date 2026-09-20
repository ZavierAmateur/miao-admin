import { describe, expect, it, vi } from 'vitest'
import { getSaveDiagnostics } from './adminPlayers'

describe('adminPlayers', () => {
  it('从独立受权接口读取当前 user 存档正文', async () => {
    const responseData = {
      current: {
        revision: 8,
        clientVersion: '1.0.0',
        clientSavedAt: 1_000,
        serverSavedAt: 1_100,
        sizeBytes: 256,
        user: { level: 5, gold: 120 },
      },
      previous: null,
      changes: [],
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      timestamp: 1,
      requestId: 'response-request',
      data: responseData,
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getSaveDiagnostics('player/1')).resolves.toEqual(responseData)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/admin/v1/players/player%2F1/save')
  })
})
