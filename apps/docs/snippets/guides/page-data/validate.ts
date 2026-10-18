import type { GissenData } from 'gissen'
import { GissenValidationError, validateData } from 'gissen'
import config from '../rendering/config'

export function parsePage(raw: unknown): GissenData | null {
  try {
    return validateData(raw, config)
  }
  catch (error) {
    if (error instanceof GissenValidationError) {
      // The message lists every problem with its path, for example
      // [content[0].props.title] Prop "title" must be a string (got number)
      console.error(error.message)

      // The same problems, one object each, with a `path` array and a `message`.
      for (const issue of error.issues)
        console.error(issue.path, issue.message)

      return null
    }
    throw error
  }
}
