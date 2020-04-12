"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const page_exports_transforms_1 = __importDefault(require("../../src/babel/plugins/page-exports-transforms"));
const compile = (input, opts) => {
    var _a;
    return ((_a = core_1.transformSync(input, {
        plugins: [[page_exports_transforms_1.default, opts]],
    })) === null || _a === void 0 ? void 0 : _a.code) || '';
};
test('remove function declaration', () => {
    const code = compile(`
  export function getServerSideProps() {
    return {}
  }
  export function getStaticProps() {
    return {}
  }
  export function getStaticPaths() {
    return {}
  }
  `);
    expect(code).toMatchInlineSnapshot(`
    "export var __re0 = true;
    export var __re1 = true;
    export var __re2 = true;"
  `);
});
test('remove unused stuff', () => {
    const code = compile(`
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
  `);
    expect(code).toMatchInlineSnapshot(`
    "var x = 2;
    export var __re0 = true;
    export var __re1 = true;
    export var __re2 = true;"
  `);
});
test('remove variable declaration', () => {
    const code = compile(`
  export var getServerSideProps= function() {
    return {}
  }
  export const getStaticProps= function() {
    return {}
  }
  export let getStaticPaths = function() {
    return {}
  }
  `);
    expect(code).toMatchInlineSnapshot(`
    "export var __re0 = true;
    export const __re1 = true;
    export let __re2 = true;"
  `);
});
test('remove re-exports', () => {
    const code = compile(`
  export {getServerSideProps} from './'
  export {getStaticProps} from './'
  export {getStaticPaths} from './'
  `);
    expect(code).toMatchInlineSnapshot(`
    "export var __re0 = true;
    export var __re1 = true;
    export var __re2 = true;"
  `);
});
test('keep other exports', () => {
    const code = compile(`
  export const a = 1
  export {getServerSideProps} from './'`);
    expect(code).toMatchInlineSnapshot(`
    "export const a = 1;
    export var __re0 = true;"
  `);
});
//# sourceMappingURL=babel-plugin-page-exports-transforms.test.js.map