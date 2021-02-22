import { ReamConfig } from 'ream'

const config: ReamConfig = {
  plugins: [
    [
      '@ream/plugin-google-analytics',
      {
        trackingId: 'UA-54857209-24',
      },
    ],
  ],
  imports: ['prismjs/themes/prism-tomorrow.css', 'windi.css', '@/css/main.css'],
  vite(config) {
    config.plugins!.push(require('vite-plugin-windicss').default())
  },
}

export default config
