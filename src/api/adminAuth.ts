import { apiRequest } from './client'
import type { AdminIdentity } from '../stores/auth'

interface AuthResponse {
  readonly identity: AdminIdentity
  readonly expiresAt: number
}

export function login(account: string, password: string): Promise<AuthResponse> {
  return apiRequest('/admin/v1/auth/login', { method: 'POST', body: { account, password } })
}

export function getCurrentAdmin(): Promise<AuthResponse> {
  return apiRequest('/admin/v1/auth/me')
}

export function logout(): Promise<{ readonly loggedOut: true }> {
  return apiRequest('/admin/v1/auth/logout', { method: 'POST' })
}
