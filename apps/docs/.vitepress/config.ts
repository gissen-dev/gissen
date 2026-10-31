import type { DefaultTheme } from 'vitepress'
import { existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { status } from './status'

interface DemoVideo {
  mp4?: string
  webm?: string
  poster?: string
}

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))

/**
 * A demo clip counts as present when its files exist under public/demo/.
 * Which formats exist is decided here, at build time, so dropping new files
 * in (scripts/demo-video/README.md) changes the site without a code change.
 */
function demoVideo(kind: 'editor' | 'agent'): DemoVideo | undefined {
  const found: DemoVideo = {}
  for (const [key, file] of [['mp4', `${kind}.mp4`], ['webm', `${kind}.webm`], ['poster', `${kind}-poster.jpg`]] as const) {
    if (existsSync(`${publicDir}demo/${file}`))
      found[key] = `/demo/${file}`
  }
  return found.mp4 || found.webm ? found : undefined
}

const themeConfig: DefaultTheme.Config & { demoVideos: Record<'editor' | 'agent', DemoVideo | undefined> } = {
  search: { provider: 'local' },

  demoVideos: {
    editor: demoVideo('editor'),
    agent: demoVideo('agent'),
  },

  nav: [
    { text: 'Getting started', link: '/getting-started/quickstart' },
    { text: 'Guides', link: '/guides/defining-components' },
    { text: 'AI agents', link: '/agents/mcp' },
    { text: 'API', link: '/api/gissen' },
    { text: 'Examples', link: '/examples' },
    { text: 'Playground', link: '/playground' },
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
      text: 'Try it',
      items: [
        { text: 'Playground', link: '/playground' },
        { text: 'Examples', link: '/examples' },
      ],
    },
  ],

  socialLinks: [
    { icon: 'github', link: 'https://github.com/gissen-dev/gissen' },
  ],
}

export default defineConfig({
  title: 'Gissen',
  description: `The headless visual editor for Vue. Status: ${status.label}.`,

  // why-gissen.md is a draft to be rewritten. It is not built, so it cannot
  // ship with a release by accident. Read it locally with
  // `DOCS_DRAFTS=1 pnpm --filter gissen-docs dev`. When it is ready: delete
  // this line, add it to the sidebar and remove `search: false` from it.
  srcExclude: process.env.DOCS_DRAFTS ? [] : ['why-gissen.md'],

  themeConfig,
})
