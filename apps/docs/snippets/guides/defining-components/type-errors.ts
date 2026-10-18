import { defineGissenConfig } from 'gissen'
import Hero from './components/Hero.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        cta: {
          type: 'select',
          options: [
            { label: 'Sign up', value: 'signup' },
            { label: 'Buy now', value: 'buy' },
          ],
        },
      },
      // @ts-expect-error 'subscribe' is not one of the option values
      defaultProps: { cta: 'subscribe' },
      render: Hero,
    },
  },
})
