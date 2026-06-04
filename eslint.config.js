import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  vue: true,
  typescript: true,
  ignores: [
    'gissen-claude-code-etap-*.md',
    '**/dist/**',
    '**/.vitepress/cache/**',
    '**/.vitepress/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
  ],
})
