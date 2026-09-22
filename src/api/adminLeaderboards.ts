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

export function listLevelLeaderboard(page = 1): Promise<LevelLeaderboardPage> {
  return apiRequest(`/admin/v1/leaderboards/level?page=${encodeURIComponent(String(page))}`)
}
