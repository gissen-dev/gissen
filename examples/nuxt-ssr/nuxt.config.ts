export default defineNuxtConfig({
  nitro: {
    // In-memory: resets on every server restart. A real app points this (or
    // its own storage entirely) at something durable. See server/api/page.*.
    storage: {
      page: { driver: 'memory' },
    },
  },
})
