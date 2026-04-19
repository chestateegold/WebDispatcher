import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    Components({
      dts: 'src/components.d.ts',
      dirs: ['src/components'],
    }),
    AutoImport({
      dts: 'src/auto-imports.d.ts',
      imports: ['vue', 'pinia'],
      dirs: ['src/stores', 'src/components/turnout'],
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5129',
      '/cmriHub': {
        target: 'http://localhost:5129',
        ws: true,
      },
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
