import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      bundleTypes: true,
      // Both options below are required for the published declarations to be
      // self-contained (no `.vue` imports — consumers saw GissenEditor as `any`
      // in every alpha ≤ 0.1.0-alpha.5):
      // - processor 'vue' must be explicit: the plugin's auto-detection scans
      //   only two directory levels for `.vue` files, ours sit at
      //   src/components/**, so it silently fell back to the ts processor and
      //   emitted no declarations for SFCs at all.
      // - cleanVueFileName rewrites `.vue` import specifiers to extension-less
      //   ones in the interim declarations, so api-extractor can resolve the
      //   SFC's dts and inline it instead of leaving the import verbatim.
      processor: 'vue',
      cleanVueFileName: true,
    }),
  ],
  define: {
    // Rewrite the `__DEV__` guard to a consumer-evaluable expression rather than
    // baking a fixed value during the library build. The consumer's bundler then
    // keeps dev-only guards (e.g. the deep-reactivity warning) active in dev and
    // tree-shakes them in their own production build. The identity mapping for
    // `process.env.NODE_ENV` stops Vite from collapsing that expression to
    // 'production' at library-build time.
    '__DEV__': 'process.env.NODE_ENV !== "production"',
    'process.env.NODE_ENV': 'process.env.NODE_ENV',
  },
  build: {
    // Ship the library unminified: consumers' bundlers minify on their side, and
    // the (rolldown/oxc) minifier in Vite 8 can emit an invalid bundle with a
    // duplicate top-level identifier that downstream Rollup (Vite 7) rejects
    // ("Identifier 'h' has already been declared").
    minify: false,
    lib: {
      // Two entries: the full barrel, and the render-only subpath. Splitting
      // at build time is what makes `gissen/render` editor-free — module-scope
      // initialization in the editor stack (Sortable's browser sniffing, zod
      // schema construction) survives consumer tree-shaking of the single
      // barrel bundle, so a render-only app needs an entry that never
      // includes those modules.
      entry: {
        index: fileURLToPath(new URL('src/index.ts', import.meta.url)),
        render: fileURLToPath(new URL('src/render/index.ts', import.meta.url)),
      },
      name: 'GissenCore',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
