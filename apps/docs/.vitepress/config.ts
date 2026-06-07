import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Gissen',
  description: 'The headless visual editor for Vue. Agent-native, self-hostable, MIT-licensed.',

  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gissen-dev/gissen' },
    ],
  },
})
