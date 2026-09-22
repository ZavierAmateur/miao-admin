import { describe, expect, it, vi } from 'vitest'
import { listLevelLeaderboard } from './adminLeaderboards'

describe('adminLeaderboards', () => {
  it('按页读取固定20条的闯关榜管理接口', async () => {
    const responseData = {
      items: [{
        rank: 21,
        playerId: 'player-21',
        platform: 'wechat',
        level: 80,
        nickName: '旅行者21',
        avatarUrl: '',
        reachedAt: 2_000,
        updatedAt: 2_100,
      }],
      page: 2,
      pageSize: 20,
      hasMore: false,
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      timestamp: 1,
      requestId: 'leaderboard-request',
      data: responseData,
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(listLevelLeaderboard({
      page: 2,
      nickName: '旅行猫',
      platform: 'wechat',
      playerId: 'player-21',
    })).resolves.toEqual(responseData)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/admin/v1/leaderboards/level?page=2&nickName=%E6%97%85%E8%A1%8C%E7%8C%AB&platform=wechat&playerId=player-21',
    )
  })
})
