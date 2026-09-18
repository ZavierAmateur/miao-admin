import { defineStore } from 'pinia'

export type AdminRole = 'viewer' | 'support' | 'operator' | 'admin'

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
  },
})
