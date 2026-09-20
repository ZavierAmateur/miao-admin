import { apiRequest } from './client'

export interface AdminErrorLog {
  readonly id: string
  readonly occurredAt: number
  readonly requestId: string
  readonly method: string
  readonly path: string
  readonly statusCode: number
  readonly code: string
  readonly message: string
  readonly errorName: string
}

export interface AdminErrorLogQuery {
  readonly requestId?: string
  readonly code?: string
  readonly from?: number
  readonly to?: number
  readonly cursor?: string
  readonly limit?: number
}

export function listErrorLogs(query: AdminErrorLogQuery = {}): Promise<{
  readonly items: readonly AdminErrorLog[]
  readonly nextCursor: string | null
}> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return apiRequest(`/admin/v1/errors${suffix}`)
}

export function getErrorLog(id: string): Promise<AdminErrorLog> {
  return apiRequest(`/admin/v1/errors/${encodeURIComponent(id)}`)
}
