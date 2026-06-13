import { defineGissenConfig } from 'gissen'
import Container from './components/Container.vue'
import Hero from './components/Hero.vue'
import PricingCard from './components/PricingCard.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text' as const, label: 'Title' },
        count: { type: 'number' as const, label: 'Count', min: 0 },
        cta: {
          type: 'select' as const,
          label: 'Call to action',
          options: [
            { label: 'Sign up', value: 'signup' },
            { label: 'Buy now', value: 'buy' },
          ] as const,
        },
      },
      defaultProps: { title: 'Hello', count: 0, cta: 'signup' },
      render: Hero,
    },
    PricingCard: {
      fields: {
        name: { type: 'text' as const, label: 'Plan name' },
        featured: { type: 'boolean' as const, label: 'Featured' },
        features: { type: 'slot' as const, label: 'Features' },
      },
      defaultProps: { name: '', featured: false, features: [] },
      render: PricingCard,
    },
    Container: {
      fields: {
        children: { type: 'slot' as const, label: 'Children' },
      },
      defaultProps: { children: [] },
      render: Container,
    },
  },
})
