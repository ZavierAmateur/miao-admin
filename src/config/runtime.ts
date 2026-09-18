export type AppEnvironment = 'development' | 'test' | 'production'

const allowedEnvironments = new Set<AppEnvironment>(['development', 'test', 'production'])

function readEnvironment(value: string | undefined): AppEnvironment {
  return value && allowedEnvironments.has(value as AppEnvironment)
    ? value as AppEnvironment
    : 'development'
}

export const runtimeConfig = Object.freeze({
  environment: readEnvironment(import.meta.env.VITE_APP_ENV),
  apiBaseUrl: (import.meta.env.VITE_ADMIN_API_BASE_URL?.trim() || '').replace(/\/+$/, ''),
})
