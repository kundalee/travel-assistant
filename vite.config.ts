import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    /* 開發用測試帳號（.env.local 的 TEST_ACCOUNTS）：只注入 dev server，正式建置一律為空 */
    define: {
      __TEST_ACCOUNTS__: JSON.stringify(command === 'serve' ? env.TEST_ACCOUNTS ?? '' : ''),
    },
    server: {
      /* 開發時把 /api/* 轉給真正的後端（避免跨網域 CORS）：搭配 VITE_API_BASE_URL=/api */
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
