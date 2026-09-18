import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      'element-plus/es',
      'element-plus/es/components/alert/style/css',
      'element-plus/es/components/aside/style/css',
      'element-plus/es/components/button/style/css',
      'element-plus/es/components/card/style/css',
      'element-plus/es/components/container/style/css',
      'element-plus/es/components/divider/style/css',
      'element-plus/es/components/form-item/style/css',
      'element-plus/es/components/form/style/css',
      'element-plus/es/components/header/style/css',
      'element-plus/es/components/icon/style/css',
      'element-plus/es/components/input/style/css',
      'element-plus/es/components/main/style/css',
      'element-plus/es/components/menu-item/style/css',
      'element-plus/es/components/menu/style/css',
      'element-plus/es/components/result/style/css',
      'element-plus/es/components/table-column/style/css',
      'element-plus/es/components/table/style/css',
      'element-plus/es/components/tag/style/css',
    ],
  },
  server: {
    proxy: {
      '/admin': 'http://127.0.0.1:3000',
    },
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
