import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    readonly public?: boolean
    readonly title: string
    readonly permission?: string
  }
}

export {}
