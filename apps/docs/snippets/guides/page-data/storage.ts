import type { GissenData } from 'gissen'

// Gissen never stores anything. This file is yours: swap in your own API,
// a database call, or localStorage.
const endpoint = '/api/pages/home'

export async function loadPage(): Promise<unknown> {
  const response = await fetch(endpoint)
  return response.ok ? response.json() : null
}

export async function savePage(data: GissenData): Promise<void> {
  await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  })
}
