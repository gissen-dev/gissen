// Storage is the host's job (see the Working with page data guide) — this
// route is that job, done as plainly as possible: validate, then write.
//
// In a real app, put auth in front of this route. Anyone who can reach it
// can overwrite the page. That is not this example's concern; it is yours.
import { GissenValidationError, validateData } from 'gissen'
import schema from '../../schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  let data
  try {
    // schema.ts, not gissen.config.ts: this route runs through Nitro's own
    // server bundle, which has no Vue plugin for the .vue files
    // gissen.config.ts imports for `render`. See the comment on schema.ts.
    data = validateData(body, schema)
  }
  catch (error) {
    if (error instanceof GissenValidationError) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid Gissen data', message: error.message })
    }
    throw error
  }

  await useStorage('page').setItem('data.json', data)
  return { ok: true }
})
