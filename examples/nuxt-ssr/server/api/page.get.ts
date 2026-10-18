import type { GissenData } from 'gissen'
import { samplePage } from '../../sample-page'

/** Returns the saved page, or the sample document on a fresh clone. */
export default defineEventHandler(async (): Promise<GissenData> => {
  const saved = await useStorage('page').getItem<GissenData>('data.json')
  return saved ?? samplePage()
})
