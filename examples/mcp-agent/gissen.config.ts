import { defineGissenConfig } from 'gissen'
import Hero from './src/components/Hero.vue'
import Note from './src/components/Note.vue'

// This is what the agent is constrained to: gissen-mcp derives its tool
// schemas from exactly this file. An agent can add a Hero or a Note and set
// the fields below; it cannot invent a third type or a field that isn't
// here. See README.md for the client config that points gissen-mcp at this
// file and at page.json.
export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
      },
      defaultProps: { title: 'Hello', subtitle: '' },
      render: Hero,
    },
    Note: {
      fields: {
        text: { type: 'textarea', label: 'Text' },
      },
      defaultProps: { text: '' },
      render: Note,
    },
  },
})
