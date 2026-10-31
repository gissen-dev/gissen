// Turns getting-started/quickstart.md into a bash script, so the check runs
// exactly what a reader would run: the shell blocks, in order, and the files
// the page imports as snippets, copied to the path given in their [title]
// (the destination a reader would actually use, which can differ from the
// snippet's own path in this repo — quickstart.md imports from
// examples/vite-basic/src/*, a reader's project has no examples/vite-basic
// prefix).
//
// A shell block preceded by `<!-- quickstart-check: skip -->` is left out
// (the dev server never exits).
//
// Usage: node extract-steps.mjs <docs-dir> [--tarball <path>]
//   --tarball replaces the one `npm install gissen` line with an install of
//   the given tarball. If the line is not in the page, this fails, so a page
//   edit cannot silently turn the check into a no-op.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const [docsDir, ...rest] = process.argv.slice(2)
const tarballIndex = rest.indexOf('--tarball')
const tarball = tarballIndex === -1 ? undefined : rest[tarballIndex + 1]

const page = readFileSync(path.join(docsDir, 'getting-started', 'quickstart.md'), 'utf8').split('\n')
const out = ['set -euo pipefail']
let skipNext = false
let inShell = false
let skipping = false
let replaced = false
let installLines = 0

for (const line of page) {
  if (line.trim() === '<!-- quickstart-check: skip -->') {
    skipNext = true
    continue
  }
  const fence = /^```(\w*)/.exec(line)
  if (fence) {
    if (inShell || skipping) {
      inShell = false
      skipping = false
    }
    else if (fence[1] === 'sh') {
      skipping = skipNext
      inShell = !skipNext
      skipNext = false
    }
    continue
  }
  if (inShell) {
    if (line.trim() === 'npm install gissen') {
      installLines++
      if (tarball) {
        out.push(`npm install "${tarball}"`)
        replaced = true
        continue
      }
    }
    out.push(line)
    continue
  }
  const snippet = /^<<< @\/(\S+) \[(\S+)\]$/.exec(line)
  if (snippet) {
    const [, sourcePath, destPath] = snippet
    out.push(`mkdir -p "$(dirname "${destPath}")"`)
    out.push(`cp "${path.resolve(docsDir, sourcePath)}" "${destPath}"`)
  }
}

if (installLines !== 1) {
  console.error(`Expected exactly one "npm install gissen" line in quickstart.md, found ${installLines}.`)
  process.exit(1)
}
if (tarball && !replaced) {
  console.error('Could not substitute the tarball.')
  process.exit(1)
}
process.stdout.write(`${out.join('\n')}\n`)
