import { defineConfig } from 'vitest/config'
import { versionDefine } from './build-version'

export default defineConfig({
  define: versionDefine,
})
