import { writeStaticFiles } from './write-static-files'
import { Ream } from '.'

export async function exportSite(api: Ream) {
  await writeStaticFiles(api)
}
