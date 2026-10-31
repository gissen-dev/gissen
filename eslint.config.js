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
    // Examples are consumers, not workspace members (locked decision 2):
    // each is its own scaffolded project (create-vite, nuxi), with its own
    // tooling choices, not this monorepo's conventions. Their own install +
    // build + typecheck is what scripts/examples-check/run.sh verifies.
    'examples/**',
    // Deliberately malformed JSON: a fixture for the MCP error catalogue's
    // "data file is not valid JSON" case, not a file meant to parse.
    'apps/docs/tests/fixtures/mcp-catalogue/invalid-json.json',
  ],
})
