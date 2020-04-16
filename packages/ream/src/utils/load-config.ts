import JoyCon from 'joycon'

export function loadConfig(cwd: string) {
  const joycon = new JoyCon()

  return joycon.loadSync(['ream.config.js'], cwd)
}