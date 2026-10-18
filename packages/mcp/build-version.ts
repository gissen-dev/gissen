import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/**
 * The package version, injected as a compile-time constant. Shared by
 * `tsup.config.ts` (the shipped build) and `vitest.config.ts` (tests that run
 * `src` directly), so both see the same value and neither can drift from
 * `package.json`. It cannot be a plain `import` of package.json: the tsconfig
 * `rootDir` is `src`.
 */
export const versionDefine = {
  __GISSEN_MCP_VERSION__: JSON.stringify(version),
}
