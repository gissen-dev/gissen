import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { status } from '../.vitepress/status'
import { docsRoot, listPages } from './helpers/markdown'

// The landing page, the quickstart and the READMEs each say what the project
// is and how to install it. They are written by hand in four places, so this
// file is what stops them drifting apart: one status sentence, one install
// command, one way of mentioning Puck, and a draft page that stays a draft.

const repoRoot = path.resolve(docsRoot, '..', '..')

function read(relativeToRepo: string): string {
  return readFileSync(path.join(repoRoot, relativeToRepo), 'utf8')
}

const readmes = ['README.md', 'packages/core/README.md', 'packages/mcp/README.md']
const exampleReadmes = readdirSync(path.join(repoRoot, 'examples'))
  .map(name => `examples/${name}/README.md`)
  .filter(file => existsSync(path.join(repoRoot, file)))

/** Everything a reader sees as prose: the docs pages and every README. */
const publicText: [name: string, text: string][] = [
  ...listPages().map(page => [path.relative(repoRoot, page), readFileSync(page, 'utf8')] as [string, string]),
  ...[...readmes, ...exampleReadmes].map(file => [file, read(file)] as [string, string]),
]

describe('status', () => {
  it.each(readmes)('%s states the project status in the words of status.ts', (file) => {
    expect(read(file)).toContain(status.notice)
  })

  it('is alpha, and nothing calls it pre-alpha', () => {
    expect(status.label).toBe('alpha')
    const offenders = [
      ...publicText.map(([name, text]) => [name, text] as const),
      ['CONTRIBUTING.md', read('CONTRIBUTING.md')] as const,
      ['.github/ISSUE_TEMPLATE/bug_report.yml', read('.github/ISSUE_TEMPLATE/bug_report.yml')] as const,
    ]
      .filter(([, text]) => /pre-alpha/i.test(text))
      .map(([name]) => name)
    expect(offenders.join('\n'), 'Files that still say pre-alpha').toBe('')
  })

  it('is shown on the landing page, the quickstart and the playground', () => {
    for (const page of ['index.md', 'getting-started/quickstart.md', 'playground.md'])
      expect(readFileSync(path.join(docsRoot, page), 'utf8'), page).toContain('<GissenStatus />')
  })
})

describe('install command', () => {
  const places = ['README.md', 'packages/core/README.md', 'apps/docs/index.md', 'apps/docs/getting-started/quickstart.md']

  it.each(places)('%s says npm install gissen', (file) => {
    expect(read(file)).toMatch(/^npm install gissen$/m)
  })

  it('has no competing install command for the same package', () => {
    const offenders = places.filter(file => /(?:pnpm add|yarn add|bun add) gissen\b/.test(read(file)))
    expect(offenders.join('\n')).toBe('')
  })
})

describe('puck', () => {
  const sentence = 'If you know [Puck](https://github.com/puckeditor/puck) for React, Gissen takes a similar approach for Vue.'

  it.each(['README.md', 'packages/core/README.md', 'apps/docs/index.md'])('%s mentions Puck in the one agreed form', (file) => {
    expect(read(file)).toContain(sentence)
  })

  it('makes no comparison, parity claim or ranking anywhere', () => {
    const banned = /Vue equivalent of|alternative to|better than|drop-in|feature parity/i
    const offenders = publicText.filter(([, text]) => banned.test(text)).map(([name]) => name)
    expect(offenders.join('\n')).toBe('')
  })
})

describe('writing style', () => {
  it('uses no em dashes and none of the banned marketing words', () => {
    const banned = /—|powerful|seamless|blazing|effortless|revolutionary|game-changing/i
    const offenders = publicText.filter(([, text]) => banned.test(text)).map(([name]) => name)
    expect(offenders.join('\n'), 'Pages with an em dash or a banned word').toBe('')
  })
})

describe('why-gissen draft', () => {
  const draft = readFileSync(path.join(docsRoot, 'why-gissen.md'), 'utf8')

  it('is marked as a draft and kept out of search', () => {
    expect(draft).toContain('DRAFT')
    expect(draft).toMatch(/^search: false$/m)
  })

  it('is not linked from any page', () => {
    const linking = publicText
      .filter(([name]) => name !== 'apps/docs/why-gissen.md')
      .filter(([, text]) => text.includes('why-gissen'))
      .map(([name]) => name)
    expect(linking.join('\n')).toBe('')
  })

  it('is kept out of the navigation and out of the default build', () => {
    const config = readFileSync(path.join(docsRoot, '.vitepress', 'config.ts'), 'utf8')
    const mentions = config.split('\n').filter(line => line.includes('why-gissen'))
    // Only the build exclusion may name it: a comment, or the srcExclude line.
    const stray = mentions.filter(line => !line.trim().startsWith('//') && !line.includes('srcExclude'))
    expect(stray.join('\n')).toBe('')
    expect(config).toMatch(/srcExclude:.*why-gissen\.md/)
  })
})
