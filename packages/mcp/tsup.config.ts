import { defineConfig } from 'tsup'
import { versionDefine } from './build-version'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  define: versionDefine,
})
