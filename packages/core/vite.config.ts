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
