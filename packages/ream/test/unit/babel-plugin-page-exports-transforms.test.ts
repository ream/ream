import { transformSync } from '@babel/core'
import pageExportsTransforms, {
  PluginOpts,
} from '../../src/babel/plugins/page-exports-transforms'

const compile = (input: string, opts?: PluginOpts) => {
  return (
    transformSync(input, {
      plugins: [[pageExportsTransforms, opts]],
    })?.code || ''
  )
}

test('remove function declaration', () => {
  const code = compile(
    `
  export function getServerSideProps() {
    return {}
  }
  export function getStaticProps() {
    return {}
  }
  export function getStaticPaths() {
    return {}
  }
  `
  )

  expect(code).toMatchInlineSnapshot(`
    "export var __re0 = true;
    export var __re1 = true;
    export var __re2 = true;"
  `)
})

test('remove references that are only used in ssr exports', () => {
  const code = compile(
    `
    var readFile = require('fs').readFile
    import foo from 'foo'
    import { getStaticProps } from './'
  const a = 1
  function bar() {

  }
  var x = 2
  export function getServerSideProps() {
    return {a, bar, foo, readFile: readFile.toString()}
  }
  export  { getStaticProps }
  export function getStaticPaths() {
    return {}
  }
  `
  )

  expect(code).toMatchInlineSnapshot(`
    "var x = 2;
    export var __re0 = true;
    export var __re1 = true;
    export var __re2 = true;"
  `)
})

test('remove variable declaration', () => {
  const code = compile(
    `
  export var getServerSideProps= function() {
    return {}
  }
  export const getStaticProps= function() {
    return {}
  }
  export let getStaticPaths = function() {
    return {}
  }
  `
  )

  expect(code).toMatchInlineSnapshot(`
    "export var __re0 = true;
    export var __re1 = true;
    export var __re2 = true;"
  `)
})

test('remove re-exports', () => {
  const code = compile(
    `
  export {getServerSideProps} from './'
  export {getStaticProps} from './'
  export {getStaticPaths} from './'
  `
  )

  expect(code).toMatchInlineSnapshot(`
    "export var __re0 = true;
    export var __re1 = true;
    export var __re2 = true;"
  `)
})

test('keep other exports', () => {
  const code = compile(`
  export const a = 1
  export {getServerSideProps} from './'`)
  expect(code).toMatchInlineSnapshot(`
    "export const a = 1;
    export var __re0 = true;"
  `)
})

test(`throw when getServerSideProps is used in static target`, () => {
  expect(() => {
    const code = compile(
      `
  export const getServerSideProps = () => {}
  `,
      {
        buildTarget: 'static',
      }
    )
    console.log(code)
  }).toThrowErrorMatchingInlineSnapshot(
    `"unknown: You can't use getServerSideProps when build target is set to \\"static\\""`
  )
})
