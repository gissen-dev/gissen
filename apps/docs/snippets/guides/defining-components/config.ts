import { defineGissenConfig } from 'gissen'
import Hero from './components/Hero.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        count: { type: 'number', label: 'Count', min: 0 },
        cta: {
          type: 'select',
          label: 'Call to action',
          options: [
            { label: 'Sign up', value: 'signup' },
            { label: 'Buy now', value: 'buy' },
          ],
        },
      },
      defaultProps: { title: 'Hello', count: 0, cta: 'signup' },
      render: Hero,
    },
  },
})
