import JoyCon from 'joycon'
import { dirname } from 'path'

export function resolveFiles(files: string[], cwd: string) {
  const joycon = new JoyCon()
  return joycon.resolve(files, cwd, dirname(cwd))
}
