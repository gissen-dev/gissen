import { defineGissenConfig } from 'gissen'
import PageShell from './components/PageShell.vue'

export default defineGissenConfig({
  components: {},
  root: {
    fields: { theme: { type: 'text' } },
    defaultProps: { theme: 'light' },
    render: PageShell,
  },
})
