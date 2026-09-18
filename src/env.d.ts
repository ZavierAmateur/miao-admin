/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_API_BASE_URL?: string
  readonly VITE_APP_ENV?: 'development' | 'test' | 'production'
}

interface ImportMeta { readonly env: ImportMetaEnv }
