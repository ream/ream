import { defineReamConfig } from 'ream'
import ga from '@ream/plugin-google-analytics'

export default defineReamConfig({
  plugins: [ga()],
  imports: ['prismjs/themes/prism-tomorrow.css', 'windi.css', '@/css/main.css'],
  vite(config) {
    config.plugins!.push(require('vite-plugin-windicss').default())
  },
  vue: {
    runtimeTemplateCompiler: true,
  },
})
