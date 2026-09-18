import { apiRequest } from './client'

export type PlayerPlatform = 'wechat' | 'bytedance'
export type PlayerStatus = 'active' | 'banned'

export interface SaveSummary {
  readonly revision: number
  readonly clientVersion: string
  readonly clientSavedAt: number
  readonly serverSavedAt: number
  readonly sizeBytes: number
}

export interface PlayerListItem {
  readonly id: string
  readonly platform: PlayerPlatform
  readonly status: PlayerStatus
  readonly createdAt: number
  readonly lastLoginAt: number
  readonly save: SaveSummary | null
}

export interface PlayerDetail extends PlayerListItem {
  readonly appId: string
  readonly profile: {
    readonly nickName: string
    readonly avatarUrl: string
    readonly updatedAt: number
  } | null
}

export interface PlayerQuery {
  readonly playerId?: string
  readonly platform?: PlayerPlatform
  readonly status?: PlayerStatus
  readonly cursor?: string
  readonly limit?: number
}

export function listPlayers(query: PlayerQuery = {}): Promise<{
  readonly items: readonly PlayerListItem[]
  readonly nextCursor: string | null
}> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return apiRequest(`/admin/v1/players${suffix}`)
}

export function getPlayer(playerId: string): Promise<PlayerDetail> {
  return apiRequest(`/admin/v1/players/${encodeURIComponent(playerId)}`)
}
