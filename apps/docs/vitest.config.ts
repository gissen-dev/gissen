import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The MCP check starts a real server process and waits for it to answer.
    testTimeout: 30_000,
  },
})
