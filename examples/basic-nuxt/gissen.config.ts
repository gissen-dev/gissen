import { defineGissenConfig } from 'gissen'
import Container from './components/Container.vue'
import FeatureCard from './components/FeatureCard.vue'
import Hero from './components/Hero.vue'
import TextBlock from './components/TextBlock.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        cta: {
          type: 'select',
          label: 'CTA',
          options: [
            { label: 'Get started free', value: 'get-started' },
            { label: 'Learn more', value: 'learn-more' },
          ],
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
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body' },
      },
      defaultProps: {
        heading: 'How it works',
        body: 'Register your Vue components with a typed config. Users drag them onto the canvas — the output is plain JSON you render anywhere.',
      },
      render: TextBlock,
    },
    FeatureCard: {
      fields: {
        icon: { type: 'text', label: 'Icon (emoji)' },
        title: { type: 'text', label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
        badge: { type: 'number', label: 'Badge number' },
        highlighted: { type: 'boolean', label: 'Highlighted' },
      },
      defaultProps: {
        icon: '⚡',
        title: 'Feature',
        description: 'Describe what makes this feature great.',
        badge: 1,
        highlighted: false,
      },
      render: FeatureCard,
    },
    Container: {
      fields: {
        children: { type: 'slot', label: 'Children' },
      },
      defaultProps: { children: [] },
      render: Container,
    },
  },
  root: {
    render: defineComponent({
      setup: (_, { slots }) =>
        () => h('main', { style: 'background:#f5f3f0; padding:2rem;' }, slots.default?.()),
    }),
  },
})
