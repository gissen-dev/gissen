import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import GissenStatus from './GissenStatus.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('GissenStatus', GissenStatus)
  },
} satisfies Theme
