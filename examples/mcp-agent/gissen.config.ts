import { defineGissenConfig } from 'gissen'
import Container from './src/components/Container.vue'
import FeatureCard from './src/components/FeatureCard.vue'
import Hero from './src/components/Hero.vue'
import PageRoot from './src/components/PageRoot.vue'
import TextBlock from './src/components/TextBlock.vue'

// The same config, components and page.json as the live agent demo this
// example grew out of (examples/basic-nuxt before Phase 8), so a recording of
// that demo shows exactly what this example does.
//
// This file is what the agent is held to: gissen-mcp derives its tool
// schemas from it. Keep it to `gissen` and `.vue` imports only. gissen-mcp
// loads it standalone and swaps every `.vue` import for a stub, so anything
// else (a runtime dependency, a Nuxt-style auto-import) breaks the agent
// while the app keeps working. That is why the page root is a .vue file.
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
        badge: { type: 'number', label: 'Badge number', min: 1, max: 99 },
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
    render: PageRoot,
  },
})
