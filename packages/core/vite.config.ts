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
