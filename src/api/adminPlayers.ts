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

export interface PlayerProfileSummary {
  readonly nickName: string
  readonly avatarUrl: string
  readonly updatedAt: number
}

export interface PlayerListItem {
  readonly id: string
  readonly platform: PlayerPlatform
  readonly status: PlayerStatus
  readonly createdAt: number
  readonly lastLoginAt: number
  readonly profile: PlayerProfileSummary | null
  readonly save: SaveSummary | null
}

export interface PlayerDetail extends PlayerListItem {
  readonly appId: string
  readonly ban: {
    readonly reason: string
    readonly expiresAt: number
    readonly bannedAt: number
    readonly permanent: boolean
  } | null
  readonly profile: PlayerProfileSummary | null
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

export interface SaveVersionDetail extends SaveSummary {
  readonly user: Readonly<Record<string, unknown>>
}

export interface SaveDiagnostics {
  readonly current: SaveVersionDetail
  readonly previous: SaveVersionDetail | null
  readonly changes: readonly {
    readonly field: string
    readonly previous: unknown
    readonly current: unknown
  }[]
}

export function getSaveDiagnostics(playerId: string): Promise<SaveDiagnostics> {
  return apiRequest(`/admin/v1/players/${encodeURIComponent(playerId)}/save`)
}

export function rollbackSave(playerId: string, expectedRevision: number, reason: string): Promise<{
  readonly sourceRevision: number
  readonly revision: number
  readonly serverSavedAt: number
}> {
  return apiRequest(`/admin/v1/players/${encodeURIComponent(playerId)}/save-rollback`, {
    method: 'POST', body: { expectedRevision, reason },
  })
}

export function banPlayer(playerId: string, input: {
  readonly type: 'temporary' | 'permanent'
  readonly expiresAt?: number
  readonly reason: string
  readonly note?: string
}): Promise<{ readonly status: PlayerStatus; readonly reason: string; readonly expiresAt: number; readonly permanent: boolean }> {
  return apiRequest(`/admin/v1/players/${encodeURIComponent(playerId)}/ban`, { method: 'POST', body: input })
}

export function unbanPlayer(playerId: string, reason: string): Promise<{ readonly status: PlayerStatus }> {
  return apiRequest(`/admin/v1/players/${encodeURIComponent(playerId)}/unban`, { method: 'POST', body: { reason } })
}
