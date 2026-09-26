import { defineGissenConfig } from 'gissen'

// Deliberately invalid in a different way than reference-error.config.ts:
// re-exporting a stub-extension file. `rewriteStubImports` intentionally
// does not rewrite `export ... from` specifiers (see its doc comment), so
// this must fail loudly when jiti tries to resolve the real `.vue` file —
// pinned here so a future regex change can't turn that into a silent
// pass-through.
export { default as HeroReexport } from './components/Hero.vue'

export default defineGissenConfig({
  components: {},
})
