import { defineGissenConfig } from 'gissen'
import Card from './components/Card.vue'
import Column from './components/Column.vue'
import Columns from './components/Columns.vue'
import Hero from './components/Hero.vue'
import Text from './components/Text.vue'

// The playground's own config, kept next to it so the page works on whatever
// `gissen` this docs build resolves to. It is deliberately small: every
// field type the docs mention appears once, and the two layout components
// show nested slots with an allow list at each level.
export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        tone: {
          type: 'select',
          label: 'Tone',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
        },
      },
      defaultProps: { title: 'A headline', subtitle: 'Edit me in the panel.', tone: 'light' },
      render: Hero,
    },
    Columns: {
      fields: {
        columns: { type: 'slot', label: 'Columns', allow: ['Column'] },
      },
      defaultProps: { columns: [] },
      render: Columns,
    },
    Column: {
      fields: {
        width: { type: 'number', label: 'Width (flex-grow)', min: 1, max: 4 },
        children: { type: 'slot', label: 'Children', allow: ['Card', 'Text'] },
      },
      defaultProps: { width: 1, children: [] },
      render: Column,
    },
    Card: {
      fields: {
        title: { type: 'text', label: 'Title' },
        rating: { type: 'number', label: 'Rating', min: 0, max: 5, step: 1 },
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
      defaultProps: { title: 'Card', rating: 3, size: 'md' },
      render: Card,
    },
    Text: {
      fields: {
        body: { type: 'textarea', label: 'Body' },
      },
      defaultProps: { body: 'Write something.' },
      render: Text,
    },
  },
})
