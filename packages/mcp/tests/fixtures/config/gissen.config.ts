import { defineGissenConfig } from 'gissen'
import Container from './components/Container.vue'
import Freeform from './components/Freeform.vue'
import Hero from './components/Hero.vue'
import './styles/hero.css'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle', rows: 3 },
        rating: { type: 'number', label: 'Rating', min: 0, max: 5, step: 1 },
        active: { type: 'boolean', label: 'Active' },
        theme: {
          type: 'select',
          label: 'Theme',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
      },
      defaultProps: {
        title: 'Hello',
        subtitle: 'World',
        rating: 5,
        active: true,
        theme: 'primary',
      },
      render: Hero,
    },
    Container: {
      fields: {
        children: { type: 'slot', label: 'Children', allow: ['Hero'] },
      },
      defaultProps: { children: [] },
      render: Container,
    },
    Freeform: {
      fields: {
        items: { type: 'slot', label: 'Items' },
      },
      defaultProps: { items: [] },
      render: Freeform,
    },
  },
  root: {
    fields: {
      siteName: { type: 'text', label: 'Site name' },
    },
  },
})
