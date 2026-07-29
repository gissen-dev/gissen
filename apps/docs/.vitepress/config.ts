import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Gissen',
  description: 'The headless visual editor for Vue. Agent-native, self-hostable, MIT-licensed.',

  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Config API', link: '/config-api' },
      { text: 'Editor', link: '/editor' },
      { text: 'Rendering', link: '/rendering' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Config API', link: '/config-api' },
          { text: 'Editor', link: '/editor' },
          { text: 'Rendering', link: '/rendering' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gissen-dev/gissen' },
    ],
  },
})
