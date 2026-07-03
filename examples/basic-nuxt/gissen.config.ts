import { defineGissenConfig } from 'gissen'
import Container from './components/Container.vue'
import FeatureCard from './components/FeatureCard.vue'
import Hero from './components/Hero.vue'
import TextBlock from './components/TextBlock.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text' as const, label: 'Title' },
        subtitle: { type: 'textarea' as const, label: 'Subtitle' },
        cta: {
          type: 'select' as const,
          label: 'CTA',
          options: [
            { label: 'Get started free', value: 'get-started' },
            { label: 'Learn more', value: 'learn-more' },
          ] as const,
        },
      },
      defaultProps: {
        title: 'Build pages visually',
        subtitle: 'Drag and drop your own Vue components. No lock-in, MIT licensed.',
        cta: 'get-started',
      },
      render: Hero,
    },
    TextBlock: {
      fields: {
        heading: { type: 'text' as const, label: 'Heading' },
        body: { type: 'textarea' as const, label: 'Body' },
      },
      defaultProps: {
        heading: 'How it works',
        body: 'Register your Vue components with a typed config. Users drag them onto the canvas — the output is plain JSON you render anywhere.',
      },
      render: TextBlock,
    },
    FeatureCard: {
      fields: {
        icon: { type: 'text' as const, label: 'Icon (emoji)' },
        title: { type: 'text' as const, label: 'Title' },
        description: { type: 'textarea' as const, label: 'Description' },
        badge: { type: 'number' as const, label: 'Badge number' },
        highlighted: { type: 'boolean' as const, label: 'Highlighted' },
      },
      defaultProps: {
        icon: '⚡',
        title: 'Feature',
        description: 'Describe what makes this feature great.',
        highlighted: false,
      },
      render: FeatureCard,
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
