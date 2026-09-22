import { apiRequest } from './client'
import type { PlayerPlatform } from './adminPlayers'

export interface LevelLeaderboardItem {
  readonly rank: number
  readonly playerId: string
  readonly platform: PlayerPlatform
  readonly level: number
  readonly nickName: string
  readonly avatarUrl: string
  readonly reachedAt: number
  readonly updatedAt: number
}

export interface LevelLeaderboardPage {
  readonly items: readonly LevelLeaderboardItem[]
  readonly page: number
  readonly pageSize: 20
  readonly hasMore: boolean
}

export interface LevelLeaderboardQuery {
  readonly page?: number
  readonly nickName?: string
  readonly platform?: PlayerPlatform
  readonly playerId?: string
}

export function listLevelLeaderboard(query: LevelLeaderboardQuery = {}): Promise<LevelLeaderboardPage> {
  const params = new URLSearchParams()
  params.set('page', String(query.page ?? 1))
  if (query.nickName) params.set('nickName', query.nickName)
  if (query.platform) params.set('platform', query.platform)
  if (query.playerId) params.set('playerId', query.playerId)
  return apiRequest(`/admin/v1/leaderboards/level?${params.toString()}`)
}
