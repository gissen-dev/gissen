import { defineGissenConfig } from 'gissen'
import Card from './components/Card.vue'
import Container from './components/Container.vue'
import Hero from './components/Hero.vue'

// The config used throughout this guide, including every captured error
// message on this page: it is the real input gissen-mcp derives its tool
// schemas and error wording from, type-checked like any other docs snippet.
export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
      },
      defaultProps: { title: 'Hello' },
      render: Hero,
    },
    Card: {
      fields: {
        rating: { type: 'number', label: 'Rating', min: 0, max: 5 },
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
      },
      defaultProps: { rating: 3, size: 'md' },
      render: Card,
    },
    Container: {
      fields: {
        // Containers can nest, so a move can land one inside its own
        // descendant — the scenario this guide's "move into a descendant"
        // error comes from.
        children: { type: 'slot', label: 'Children', allow: ['Card', 'Container'] },
      },
      defaultProps: { children: [] },
      render: Container,
    },
  },
})
