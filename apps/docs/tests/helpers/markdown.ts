import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const skippedDirs = new Set(['node_modules', '.vitepress', 'snippets', 'tests', 'public'])

/** Every markdown page of the docs site, as absolute paths. */
export function listPages(dir: string = docsRoot): string[] {
  const pages: string[] = []
  for (const entry of readdirSync(dir)) {
    if (skippedDirs.has(entry))
      continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory())
      pages.push(...listPages(full))
    else if (entry.endsWith('.md'))
      pages.push(full)
  }
  return pages.sort()
}

export function readPage(relativePath: string): string {
  return readFileSync(path.join(docsRoot, relativePath), 'utf8')
}

export interface Section {
  /** The heading text without its `#` marks and without backticks. */
  heading: string
  level: number
  /** The lines under the heading, up to the next heading. */
  body: string
}

/** Splits markdown into sections at ATX headings. Fenced code is not scanned for headings. */
export function parseSections(markdown: string): Section[] {
  const sections: Section[] = []
  let current: { heading: string, level: number, lines: string[] } | undefined
  let inFence = false

  for (const line of markdown.split('\n')) {
    if (line.startsWith('```'))
      inFence = !inFence
    const match = inFence ? null : /^(#{1,6}) (.*)$/.exec(line)
    if (match) {
      if (current)
        sections.push({ heading: current.heading, level: current.level, body: current.lines.join('\n') })
      current = { heading: match[2].replaceAll('`', '').trim(), level: match[1].length, lines: [] }
    }
    else {
      current?.lines.push(line)
    }
  }
  if (current)
    sections.push({ heading: current.heading, level: current.level, body: current.lines.join('\n') })
  return sections
}

/** The first column of a markdown table, with backticks removed. Skips the header and separator rows. */
export function firstColumn(body: string): string[] {
  const names: string[] = []
  let seenSeparator = false
  for (const line of body.split('\n')) {
    if (!line.trimStart().startsWith('|'))
      continue
    if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) {
      seenSeparator = true
      continue
    }
    if (!seenSeparator)
      continue
    const cell = line.trim().slice(1).split('|')[0]
    names.push(cell.replaceAll('`', '').trim())
  }
  return names
}

/** Rows of the first table in `body`, as arrays of trimmed cells with backticks removed. */
export function tableRows(body: string): string[][] {
  const rows: string[][] = []
  let seenSeparator = false
  for (const line of body.split('\n')) {
    if (!line.trimStart().startsWith('|')) {
      if (seenSeparator)
        break
      continue
    }
    if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) {
      seenSeparator = true
      continue
    }
    if (!seenSeparator)
      continue
    // Split on pipes that are not escaped (`\|` appears inside type cells).
    const cells = line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/)
    rows.push(cells.map(cell => cell.replaceAll('`', '').trim()))
  }
  return rows
}
