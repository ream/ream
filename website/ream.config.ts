import { ReamConfig } from 'ream'

const config: ReamConfig = {
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
}

export default config
