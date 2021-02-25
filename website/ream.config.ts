import { ReamConfig } from 'ream'
import ga from '@ream/plugin-google-analytics'

const config: ReamConfig = {
  plugins: [
    ga({
      trackingId: 'UA-54857209-24',
    }),
  ],
  imports: ['prismjs/themes/prism-tomorrow.css', 'windi.css', '@/css/main.css'],
  vite(config) {
    config.plugins!.push(require('vite-plugin-windicss').default())
  },
}

export default config
