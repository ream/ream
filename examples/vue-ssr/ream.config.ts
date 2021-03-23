import { defineConfig } from 'ream'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  vite(config) {
    config.plugins!.push(vue())
  },
})
