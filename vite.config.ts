import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      external: [
        // Exclude utils folder from build (reference code only)
        /^\/utils\//
      ]
    }
  },
  optimizeDeps: {
    exclude: ['utils']
  }
})
