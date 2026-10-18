import { defineConfig } from 'vitepress'
import { status } from './status'

export default defineConfig({
  title: 'Gissen',
  description: `The headless visual editor for Vue. Status: ${status.label}.`,

  themeConfig: {
    search: { provider: 'local' },

    nav: [
      { text: 'Getting started', link: '/getting-started/quickstart' },
      { text: 'Guides', link: '/guides/defining-components' },
      { text: 'AI agents', link: '/agents/mcp' },
      { text: 'API', link: '/api/gissen' },
      { text: 'Examples', link: '/examples' },
    ],

    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Quickstart', link: '/getting-started/quickstart' },
          { text: 'Nuxt', link: '/getting-started/nuxt' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Defining components', link: '/guides/defining-components' },
          { text: 'Slots and allow lists', link: '/guides/slots' },
          { text: 'Rendering and SSR', link: '/guides/rendering' },
          { text: 'Working with page data', link: '/guides/page-data' },
          { text: 'The editor', link: '/guides/editor' },
        ],
      },
      {
        text: 'AI agents',
        items: [
          { text: 'MCP guide', link: '/agents/mcp' },
        ],
      },
      {
        text: 'API reference',
        items: [
          { text: 'gissen and gissen/render', link: '/api/gissen' },
          { text: 'gissen-mcp', link: '/api/gissen-mcp' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'All examples', link: '/examples' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gissen-dev/gissen' },
    ],
  },
})
