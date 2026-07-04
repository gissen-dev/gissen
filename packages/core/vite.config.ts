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
      entry: fileURLToPath(new URL('src/index.ts', import.meta.url)),
      name: 'GissenCore',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
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
