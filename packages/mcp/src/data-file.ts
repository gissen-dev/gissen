import { access, constants } from 'node:fs/promises'
import { DataFileError } from './errors'

/**
 * Confirms the data file exists and is readable. Does not parse or validate
 * its contents as `GissenData` — per decision 7, every tool operation reads
 * the data file fresh, so Phase A has nothing yet to apply that content to.
 * Parsing it here would be thrown-away work and would wrongly suggest the
 * data gets cached across calls.
 */
export async function assertDataFileReadable(dataPath: string): Promise<void> {
  try {
    await access(dataPath, constants.R_OK)
  }
  catch (cause) {
    throw new DataFileError(dataPath, cause)
  }
}
