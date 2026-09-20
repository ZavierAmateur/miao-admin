import { describe, expect, it, vi } from 'vitest'
import { listErrorLogs } from './adminErrors'

describe('adminErrors', () => {
  it('只把受支持的筛选条件序列化到错误日志查询', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      timestamp: 1,
      requestId: 'response-request',
      data: { items: [], nextCursor: null },
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await listErrorLogs({
      requestId: 'request-1', code: 'SAVE_CONFLICT', from: 100, to: 200, cursor: 'next', limit: 20,
    })

    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe('/admin/v1/errors?requestId=request-1&code=SAVE_CONFLICT&from=100&to=200&cursor=next&limit=20')
  })
})
