import type { FieldGrammar, Grammar } from './types'
import process from 'node:process'

/** Renders the grammar as an indented, human-readable listing. Pure — see `printGrammar` for the I/O wrapper. */
export function formatGrammarForStderr(grammar: Grammar): string {
  const lines: string[] = ['Gissen config grammar:']

  for (const component of grammar.components) {
    lines.push(`  ${component.type}`)
    for (const field of component.fields)
      lines.push(`    ${formatField(field)}`)
  }

  if (grammar.root) {
    lines.push('  (root)')
    for (const field of grammar.root.fields)
      lines.push(`    ${formatField(field)}`)
  }

  return lines.join('\n')
}

function formatField(field: FieldGrammar): string {
  const label = field.label ? ` "${field.label}"` : ''
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'boolean':
      return `${field.name}${label}: ${field.type}`
    case 'number': {
      const range = [
        field.min !== undefined ? `min=${field.min}` : undefined,
        field.max !== undefined ? `max=${field.max}` : undefined,
        field.step !== undefined ? `step=${field.step}` : undefined,
      ].filter(Boolean).join(', ')
      return `${field.name}${label}: number${range ? ` (${range})` : ''}`
    }
    case 'select':
      return `${field.name}${label}: select [${field.options.map(o => o.value).join(', ')}]`
    case 'slot':
      return `${field.name}${label}: slot (allow: ${field.allow === 'any' ? 'any' : field.allow.join(', ')})`
  }
}

/**
 * Writes the grammar to stderr and only stderr — stdout is reserved for MCP
 * JSON-RPC traffic starting in Phase C, and Phase A establishes that
 * discipline now so nothing has to change later.
 */
export function printGrammar(grammar: Grammar): void {
  process.stderr.write(`${formatGrammarForStderr(grammar)}\n`)
}
