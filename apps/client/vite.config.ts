/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    // В проде nginx проксирует /api на notes-core (тот же origin, что клиент),
    // поэтому обложки/картинки хранятся относительным путём /api/v1/uploads/...
    // (см. toRelativeImageUrl). Дев-сервер Vite и notes-core — разные origin'ы,
    // без прокси такие пути резолвятся в несуществующий localhost:5173/api/....
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    server: {
      deps: {
        inline: [/@gravity-ui/],
      },
    },
  },
})
