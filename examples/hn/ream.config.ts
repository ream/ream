import { defineReamConfig } from 'ream'
import windicss from 'vite-plugin-windicss'

export default defineReamConfig({
  imports: ['virtual:windi.css'],
  vite(config) {
    config.plugins!.push(windicss())
  },
})
