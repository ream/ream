import { transformSync } from '@babel/core'
import transformPageExports from './transform-page-exports'

const compile = (input: string) => {
  return (
    transformSync(input, {
      plugins: [[transformPageExports]],
    })?.code || ''
  )
}

it('removes export function declaration', () => {
  const code1 = compile(
    `
  export function serverPreload() {
    return {}
  }
  `
  )

  expect(code1).toMatchInlineSnapshot(`"export var serverPreload = 1;"`)

  const code2 = compile(
    `
  export function staticPreload() {
    return {}
  }
  `
  )

  expect(code2).toMatchInlineSnapshot(`"export var staticPreload = 1;"`)
})

it('removes references that are only used in ssr exports', () => {
  const code = compile(
    `
    var readFile = require('fs').readFile
    import foo from 'foo'
    // This is kept since it's not used by ssr exports
    import { getStaticProps } from './'
  const a = 1
  function bar() {

  }
  var shouldHeep = 2
  var alsoShouldKeep =3
  console.log(alsoShouldKepp)
  export function serverPreload() {
    return {a, bar, foo, readFile: readFile.toString()}
  }
  `
  )

  expect(code).toMatchInlineSnapshot(`
    "// This is kept since it's not used by ssr exports
    import { getStaticProps } from './';
    var shouldHeep = 2;
    var alsoShouldKeep = 3;
    console.log(alsoShouldKepp);
    export var serverPreload = 1;"
  `)
})

it('removes export variable declaration', () => {
  const code = compile(
    `
  export var serverPreload= function() {
    return {}
  }
  `
  )

  expect(code).toMatchInlineSnapshot(`"export var serverPreload = 1;"`)
})

it('removes re-exports', () => {
  const code = compile(
    `
  export {serverPreload} from './'
  `
  )

  expect(code).toMatchInlineSnapshot(`"export var serverPreload = 1;"`)
})

it('keeps other exports', () => {
  const code = compile(`
  export const a = 1
  export {serverPreload} from './'`)
  expect(code).toMatchInlineSnapshot(`
    "export const a = 1;
    export var serverPreload = 1;"
  `)
})

it('removes destructuring assignment (array)', () => {
  const code = compile(`
  const [a,b,c] = d
  const e = d[0]
  export const serverPreload = () => {
    console.log(a,b,c,e)
  }`)
  expect(code).toMatchInlineSnapshot(`"export var serverPreload = 1;"`)
})
