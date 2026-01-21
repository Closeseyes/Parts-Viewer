import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // file:// 프로토콜에서도 작동하도록 상대 경로 사용
  plugins: [react()],
  build: {
    emptyOutDir: false, // electron-builder의 dist/win-unpacked 충돌 방지
  },
})
