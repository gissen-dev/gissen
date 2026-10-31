import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DemoMedia from '../../components/DemoMedia.vue'
import GissenStatus from './GissenStatus.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('GissenStatus', GissenStatus)
    // Small and dependency-free, so global registration costs nothing. The
    // playground is the opposite (it carries the editor) and is imported by
    // playground.md only.
    app.component('DemoMedia', DemoMedia)
  },
} satisfies Theme
