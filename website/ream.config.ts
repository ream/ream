import { defineReamConfig } from 'ream'

export default defineReamConfig({
  env: {
    GA_TRACKING_ID: 'UA-54857209-24',
  },
  modules: ['@ream/module-google-analytics'],
  imports: ['prismjs/themes/prism-tomorrow.css', 'windi.css', '@/css/main.css'],
  vite(config) {
    config.plugins!.push(require('vite-plugin-windicss').default())
  },
  vue: {
    runtimeTemplateCompiler: true,
  },
})
