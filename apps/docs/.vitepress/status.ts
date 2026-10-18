/**
 * The one place the project's release status is written. `<GissenStatus />`
 * renders it on the pages that show it and the site description reads it, so
 * changing the status later is an edit to this file only.
 */
export const status = {
  label: 'alpha',
  notice: 'Gissen is in alpha. APIs can change between releases. Do not use it in production.',
} as const
