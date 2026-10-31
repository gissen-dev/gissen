// Importing from `gissen/render` keeps the editor out of a render-only bundle.
import { defineGissenConfig } from 'gissen/render'
import Hero from './components/Hero.vue'
import PageShell from './components/PageShell.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: { title: { type: 'text', label: 'Title' } },
      defaultProps: { title: 'Hello' },
      render: Hero,
    },
  },
  root: {
    fields: { theme: { type: 'text' } },
    defaultProps: { theme: 'light' },
    render: PageShell,
  },
})
