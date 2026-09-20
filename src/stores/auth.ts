import { defineStore } from 'pinia'
import * as adminAuthApi from '../api/adminAuth'
import { ApiRequestError } from '../api/types'

export type AdminRole = 'operator' | 'admin'

export interface AdminIdentity {
  readonly id: string
  readonly displayName: string
  readonly role: AdminRole
  readonly permissions: readonly string[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ identity: null as AdminIdentity | null, sessionChecked: false }),
  getters: { isAuthenticated: (state) => state.identity !== null },
  actions: {
    setIdentity(identity: AdminIdentity | null) {
      this.identity = identity
      this.sessionChecked = true
    },
    hasPermission(permission: string): boolean {
      return this.identity?.permissions.includes(permission) ?? false
    },
    resetSessionCheck() {
      this.identity = null
      this.sessionChecked = false
    },
    async restoreSession(): Promise<void> {
      if (this.sessionChecked) return
      try {
        const result = await adminAuthApi.getCurrentAdmin()
        this.setIdentity(result.identity)
      } catch (error) {
        if (error instanceof ApiRequestError && [401, 403].includes(error.status)) {
          this.setIdentity(null)
          return
        }
        // 5xx、代理断开或冷启动失败不代表“会话检查完成”，必须允许页面再次探测。
        this.resetSessionCheck()
        throw error
      }
    },
    async login(account: string, password: string): Promise<void> {
      const result = await adminAuthApi.login(account, password)
      this.setIdentity(result.identity)
    },
    async logout(): Promise<void> {
      try {
        await adminAuthApi.logout()
      } finally {
        this.setIdentity(null)
      }
    },
  },
})
