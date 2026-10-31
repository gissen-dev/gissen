import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { docsRoot, readPage } from './helpers/markdown'

// examples/vite-basic is the Quickstart, verbatim (locked decision: it is
// the single source of its code, and is frozen at quickstart's scope — any
// addition to it would silently appear in the Quickstart, and any feature
// demo belongs in examples/layouts-and-slots instead). This test keeps the
// two in sync without a human comparing them by eye: every file under
// examples/vite-basic/src must be imported by quickstart.md, and every
// snippet import in quickstart.md must point at a file that exists there.

const exampleSrc = path.resolve(docsRoot, '..', '..', 'examples', 'vite-basic', 'src')

function listFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory())
      files.push(...listFiles(full))
    else
      files.push(full)
  }
  return files
}

describe('examples/vite-basic is the Quickstart\'s only source', () => {
  const quickstart = readPage('getting-started/quickstart.md')
  const imported = new Set(
    [...quickstart.matchAll(/^<<< @\/\.\.\/\.\.\/examples\/vite-basic\/src\/(\S+) \[/gm)].map(match => match[1]),
  )
  const onDisk = new Set(listFiles(exampleSrc).map(file => path.relative(exampleSrc, file)))

  it('imports every file in examples/vite-basic/src', () => {
    const missing = [...onDisk].filter(file => !imported.has(file)).sort()
    expect(missing.join('\n'), 'Files in examples/vite-basic/src that quickstart.md does not show').toBe('')
  })

  it('shows no file that examples/vite-basic/src does not have', () => {
    const extra = [...imported].filter(file => !onDisk.has(file)).sort()
    expect(extra.join('\n'), 'quickstart.md imports a file examples/vite-basic/src does not have').toBe('')
  })

  it('shows each file at the same path a reader would use', () => {
    const mismatches: string[] = []
    for (const match of quickstart.matchAll(/^<<< @\/\.\.\/\.\.\/examples\/vite-basic\/src\/(\S+) \[(\S+)\]$/gm)) {
      const [, sourceRelative, title] = match
      if (title !== `src/${sourceRelative}`)
        mismatches.push(`src/${sourceRelative} is shown with the title "${title}"`)
    }
    expect(mismatches.join('\n')).toBe('')
  })

  it('finds something to check', () => {
    // A guard against both sets silently going empty (e.g. a path typo in
    // the regex above), which would make every other test in this file pass
    // for the wrong reason.
    expect(onDisk.size).toBeGreaterThan(0)
    expect(imported.size).toBeGreaterThan(0)
  })
})
