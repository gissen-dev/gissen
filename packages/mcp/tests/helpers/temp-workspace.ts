import type { Buffer } from 'node:buffer'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export interface TempWorkspace {
  dir: string
  dataPath: string
  readBytes: () => Promise<Buffer>
  seed: (json: string) => Promise<void>
  cleanup: () => Promise<void>
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')

/**
 * A real scratch directory outside the source tree, seeded with a data
 * file — for tests that need `gissen-mcp` to actually read/write on disk.
 * No test in this repo has done that before this phase; this mirrors
 * `scripts/consumer-probe/run.sh`'s conventions: `mktemp`-style creation
 * under the OS temp dir, a `GISSEN_TEST_KEEP=1` escape hatch instead of
 * always cleaning up, and a refusal to touch anything that turns out to be
 * inside the repo — the same guard that makes a recursive `rm` in a test
 * defensible at all.
 */
export async function createTempWorkspace(initialJson: string): Promise<TempWorkspace> {
  const dir = await mkdtemp(path.join(tmpdir(), 'gissen-mcp-'))
  if (dir.startsWith(REPO_ROOT))
    throw new Error(`Refusing to use a temp workspace inside the repo: ${dir}`)

  const dataPath = path.join(dir, 'page.json')
  await writeFile(dataPath, initialJson, 'utf8')

  return {
    dir,
    dataPath,
    readBytes: () => readFile(dataPath),
    seed: (json: string) => writeFile(dataPath, json, 'utf8'),
    cleanup: async () => {
      if (process.env.GISSEN_TEST_KEEP === '1') {
        process.stderr.write(`GISSEN_TEST_KEEP=1 — keeping ${dir}\n`)
        return
      }
      await rm(dir, { recursive: true, force: true })
    },
  }
}
