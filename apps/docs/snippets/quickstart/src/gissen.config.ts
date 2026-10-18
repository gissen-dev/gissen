import { defineGissenConfig } from 'gissen'
import Hero from './components/Hero.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
      },
      defaultProps: {
        title: 'Hello from Gissen',
        subtitle: 'Select this block and change its text in the panel on the right.',
      },
      render: Hero,
    },
  },
})
