import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { docsRoot, listPages } from './helpers/markdown'

/** Languages a page may write by hand. Everything else must be imported from a real file. */
const handWrittenLanguages = new Set(['sh', 'bash', 'json', 'jsonc'])

const pages = listPages()

describe('docs pages', () => {
  it('finds pages to check', () => {
    expect(pages.length).toBeGreaterThan(5)
  })

  describe.each(pages.map(page => [path.relative(docsRoot, page), page]))('%s', (_name, page) => {
    const lines = readFileSync(page, 'utf8').split('\n')

    it('has no hand-written code blocks outside shell commands and JSON', () => {
      const offenders: string[] = []
      let inFence = false
      lines.forEach((line, index) => {
        const fence = /^```(\S*)/.exec(line)
        if (!fence)
          return
        if (!inFence) {
          const language = fence[1].split(':')[0]
          if (!handWrittenLanguages.has(language))
            offenders.push(`line ${index + 1}: fenced block with language "${language || '(none)'}"`)
        }
        inFence = !inFence
      })
      expect(offenders.join('\n'), 'Import code with <<< @/snippets/... instead of typing it in the page.').toBe('')
    })

    it('imports only snippets that exist', () => {
      const problems: string[] = []
      lines.forEach((line, index) => {
        const match = /^<<< @\/(\S+)(?: \[.*\])?$/.exec(line)
        if (!match) {
          if (line.startsWith('<<<'))
            problems.push(`line ${index + 1}: cannot parse snippet import "${line}"`)
          return
        }
        const [relativePath, region] = match[1].split('#')
        const file = path.resolve(docsRoot, relativePath)
        if (!existsSync(file)) {
          problems.push(`line ${index + 1}: ${relativePath} does not exist`)
          return
        }
        if (region && !new RegExp(`#region\\s+${region}\\b`).test(readFileSync(file, 'utf8')))
          problems.push(`line ${index + 1}: ${relativePath} has no region "${region}"`)
      })
      expect(problems.join('\n'), 'Broken snippet imports').toBe('')
    })
  })
})
