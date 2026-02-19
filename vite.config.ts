import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // path 모듈 import

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // '@' 별칭을 'client/src' 폴더로 설정합니다.
      { find: '@', replacement: path.resolve(__dirname, 'client/src') },
    ]
  }
})
