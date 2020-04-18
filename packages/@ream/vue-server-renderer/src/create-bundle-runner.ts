// @ts-nocheck

// https://github.com/vuejs/vue/blob/dev/src/server/bundle-renderer/create-bundle-runner.js

import { isPlainObject } from './util'

const vm = require('vm')
const path = require('path')
const resolve = require('resolve')
const NativeModule = require('module')

function createSandbox(context: any) {
  const sandbox = {
    Buffer,
    console,
    process,
    setTimeout,
    setInterval,
    setImmediate,
    clearTimeout,
    clearInterval,
    clearImmediate,
    __VUE_SSR_CONTEXT__: context,
  }
  sandbox.global = sandbox
  return sandbox
}

function compileModule(files, basedir) {
  const compiledScripts = {}
  const resolvedModules = {}

  function getCompiledScript(filename) {
    if (compiledScripts[filename]) {
      return compiledScripts[filename]
    }
    const code = files[filename]
    const wrapper = NativeModule.wrap(code)
    const script = new vm.Script(wrapper, {
      filename,
      displayErrors: true,
    })
    compiledScripts[filename] = script
    return script
  }

  function evaluateModule(filename, sandbox, evaluatedFiles = {}) {
    if (evaluatedFiles[filename]) {
      return evaluatedFiles[filename]
    }

    const script = getCompiledScript(filename)
    const compiledWrapper = script.runInThisContext()
    const m = { exports: {} }
    const r = file => {
      file = path.posix.join('.', file)
      if (files[file]) {
        return evaluateModule(file, sandbox, evaluatedFiles)
      } else if (basedir) {
        return require(resolvedModules[file] ||
          (resolvedModules[file] = resolve.sync(file, { basedir })))
      } else {
        return require(file)
      }
    }
    compiledWrapper.call(m.exports, m.exports, r, m)

    evaluatedFiles[filename] = m.exports
    return m.exports
  }
  return evaluateModule
}

function deepClone(val) {
  if (isPlainObject(val)) {
    const res = {}
    for (const key in val) {
      res[key] = deepClone(val[key])
    }
    return res
  } else if (Array.isArray(val)) {
    return val.slice()
  } else {
    return val
  }
}

export function createBundleRunner(entry, files, basedir) {
  const evaluate = compileModule(files, basedir)
  let vueServerEntryExports // lazy creation so that errors can be caught by user
  let initialContext

  const collectNonComponentStyles = () => {
    if (!vueServerEntryExports) {
      // the initial context is only used for collecting possible non-component
      // styles injected by vue-style-loader.
      initialContext = global.__VUE_SSR_CONTEXT__ = {}
      vueServerEntryExports = evaluate(entry, global)
      // On subsequent renders, __VUE_SSR_CONTEXT__ will not be available
      // to prevent cross-request pollution.
      delete global.__VUE_SSR_CONTEXT__
    }
  }
  return {
    evaluate: (file: string) => {
      collectNonComponentStyles()
      return evaluate(file, global)
    },

    createAppFactory: userContext => {
      collectNonComponentStyles()

      userContext._registeredComponents = new Set()

      // vue-style-loader styles imported outside of component lifecycle hooks
      if (initialContext._styles) {
        userContext._styles = deepClone(initialContext._styles)
        // #6353 ensure "styles" is exposed even if no styles are injected
        // in component lifecycles.
        // the renderStyles fn is exposed by vue-style-loader >= 3.0.3
        const renderStyles = initialContext._renderStyles
        if (renderStyles) {
          Object.defineProperty(userContext, 'styles', {
            enumerable: true,
            get() {
              return renderStyles(userContext._styles)
            },
          })
        }
      }

      return vueServerEntryExports
    },
  }
}
