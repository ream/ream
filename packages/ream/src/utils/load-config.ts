import path from 'path'
import JoyCon from 'joycon'
import fs from 'fs'
import { Module } from 'module'
import { transformSync } from 'esbuild'

const joycon = new JoyCon()

const transpileAndRequire = (code: string, filepath: string, isTS: boolean) => {
  const result = transformSync(code, {
    sourcefile: filepath,
    loader: isTS ? 'ts' : 'js',
    target: 'es2019',
    format: 'cjs',
  })

  const m = requireFromString(result.code, filepath)
  return m.default || m
}

joycon.addLoader({
  test: /\.[jt]s$/,
  loadSync(filepath) {
    const code = fs.readFileSync(filepath, 'utf8')
    return transpileAndRequire(code, filepath, filepath.endsWith('.ts'))
  },
})

export function loadConfig(cwd: string) {
  joycon.clearCache()

  return joycon.loadSync(['ream.config.js', 'ream.config.ts'], cwd)
}

// https://github.com/floatdrop/require-from-string/blob/master/index.js
function requireFromString(
  code: string,
  filename: string,
  opts?: { appendPaths?: string[]; prependPaths?: string[] }
) {
  opts = opts || {}

  const appendPaths = opts.appendPaths || []
  const prependPaths = opts.prependPaths || []

  if (typeof code !== 'string') {
    throw new Error('code must be a string, not ' + typeof code)
  }

  // @ts-ignore
  const paths = Module._nodeModulePaths(path.dirname(filename))

  const parent = module.parent || undefined
  const m = new Module(filename, parent)
  m.filename = filename
  m.paths = [...prependPaths, ...paths, ...appendPaths]
  // @ts-ignore
  m._compile(code, filename)

  const exports = m.exports
  parent &&
    parent.children &&
    parent.children.splice(parent.children.indexOf(m), 1)

  return exports
}
