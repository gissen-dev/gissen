// Checks the built site, not the sources: every internal link, every #anchor
// and every local image/video/stylesheet reference must resolve to something
// in .vitepress/dist. VitePress already fails the build on a dead page link,
// but it does not look at anchors or at assets, so a renamed heading or a
// removed demo file would otherwise go unnoticed.
//
// Usage: pnpm --filter gissen-docs check:links   (after `pnpm build`)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.vitepress', 'dist')

if (!existsSync(dist)) {
  console.error(`${dist} does not exist. Run \`pnpm --filter gissen-docs build\` first.`)
  process.exit(1)
}

function listFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory())
      files.push(...listFiles(full))
    else
      files.push(full)
  }
  return files
}

const pages = new Map()
for (const file of listFiles(dist)) {
  if (file.endsWith('.html'))
    pages.set(path.relative(dist, file), readFileSync(file, 'utf8'))
}

const external = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

/** Maps a URL path (already made absolute) to a file in dist, or undefined. */
function resolveTarget(urlPath) {
  const clean = decodeURIComponent(urlPath).replace(/^\//, '')
  const candidates = clean === '' || clean.endsWith('/')
    ? [`${clean}index.html`]
    : [clean, `${clean}.html`, `${clean}/index.html`]
  return candidates.find(candidate => existsSync(path.join(dist, candidate)) && statSync(path.join(dist, candidate)).isFile())
}

const problems = []
let checked = 0

for (const [pageFile, html] of pages) {
  const pageUrl = `/${pageFile.replace(/index\.html$/, '')}`
  for (const match of html.matchAll(/\b(?:href|src|poster)="([^"]*)"/g)) {
    const value = match[1].replaceAll('&amp;', '&')
    if (value === '' || external.test(value))
      continue
    const [rawPath, fragment] = value.split('#')
    const urlPath = rawPath === ''
      ? pageUrl
      : new URL(rawPath, `http://site${pageUrl}`).pathname
    checked++
    const target = resolveTarget(urlPath)
    if (!target) {
      problems.push(`${pageFile}: ${value} (no such page or file)`)
      continue
    }
    if (fragment && target.endsWith('.html')) {
      const targetHtml = pages.get(target) ?? ''
      if (!targetHtml.includes(`id="${decodeURIComponent(fragment)}"`))
        problems.push(`${pageFile}: ${value} (no element with id "${fragment}" in ${target})`)
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} broken reference(s) in ${pages.size} pages:`)
  for (const problem of [...new Set(problems)])
    console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`OK: ${checked} internal references checked across ${pages.size} pages, none broken.`)
