import { runtimeConfig } from '../config/runtime'
import { ApiRequestError, type ApiFailure, type ApiSuccess } from './types'

export interface RequestOptions extends Omit<RequestInit, 'body'> { readonly body?: unknown }

function isApiFailure(value: unknown): value is ApiFailure {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ApiFailure>
  return typeof candidate.code === 'string' && typeof candidate.msg === 'string'
}

export async function apiRequest<T>(path: `/admin/v1/${string}`, options: RequestOptions = {}): Promise<T> {
  if (!runtimeConfig.apiBaseUrl) {
    throw new ApiRequestError(0, 'ADMIN_API_NOT_CONFIGURED', '管理 API 地址尚未配置')
  }

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Request-Id', crypto.randomUUID())
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const contentType = response.headers.get('content-type') ?? ''
  const payload: unknown = contentType.includes('application/json') ? await response.json() : undefined

  if (!response.ok) {
    if (isApiFailure(payload)) {
      throw new ApiRequestError(response.status, payload.code, payload.msg, payload.requestId)
    }
    throw new ApiRequestError(response.status, 'HTTP_ERROR', `请求失败（HTTP ${response.status}）`)
  }

  const result = payload as ApiSuccess<T> | undefined
  if (!result || result.code !== 0 || !('data' in result)) {
    throw new ApiRequestError(response.status, 'INVALID_RESPONSE', '管理 API 响应格式无效')
  }
  return result.data
}
