// Thanks to https://github.com/zeit/next.js/blob/287961ed9142a53f8e9a23bafb2f31257339ea98/packages/next/build/babel/plugins/next-ssg-transform.ts
// Modified heavily like there's no tomorrow
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// !!!!!!!! Someone please help me remove the `@ts-ignore` in this file !!!!!!!!!!!
//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import { PluginObj, NodePath } from '@babel/core'
import * as BabelTypes from '@babel/types'
import { BuildTarget } from 'ream/src'

const EXPORT_GET_SERVER_SIDE_PROPS = `getServerSideProps`
const EXPORT_GET_STATIC_PROPS = `getStaticProps`
const EXPORT_GET_STATIC_PATHS = `getStaticPaths`

export const GET_SERVER_SIDE_PROPS_INDICATOR = `__re0`
export const GET_STATIC_PROPS_INDICATOR = `__re1`
export const GET_STATIC_PATHS_INDICATOR = `__re2`

const exportPatterns = [
  {
    input: EXPORT_GET_SERVER_SIDE_PROPS,
    output: GET_SERVER_SIDE_PROPS_INDICATOR,
  },
  {
    input: EXPORT_GET_STATIC_PROPS,
    output: GET_STATIC_PROPS_INDICATOR,
  },
  {
    input: EXPORT_GET_STATIC_PATHS,
    output: GET_STATIC_PATHS_INDICATOR,
  },
]

export type PluginOpts = {
  buildTarget: BuildTarget
}

function getIdentifier(
  path: NodePath<
    | BabelTypes.FunctionDeclaration
    | BabelTypes.FunctionExpression
    | BabelTypes.ArrowFunctionExpression
  >
): NodePath<BabelTypes.Identifier> | null {
  const parentPath = path.parentPath
  if (parentPath.type === 'VariableDeclarator') {
    const pp = parentPath as NodePath<BabelTypes.VariableDeclarator>
    const name = pp.get('id')
    return name.node.type === 'Identifier'
      ? (name as NodePath<BabelTypes.Identifier>)
      : null
  }

  if (parentPath.type === 'AssignmentExpression') {
    const pp = parentPath as NodePath<BabelTypes.AssignmentExpression>
    const name = pp.get('left')
    return name.node.type === 'Identifier'
      ? (name as NodePath<BabelTypes.Identifier>)
      : null
  }

  if (path.node.type === 'ArrowFunctionExpression') {
    return null
  }

  return path.node.id && path.node.id.type === 'Identifier'
    ? (path.get('id') as NodePath<BabelTypes.Identifier>)
    : null
}

function isIdentifierReferenced(
  ident: NodePath<BabelTypes.Identifier>
): boolean {
  const b = ident.scope.getBinding(ident.node.name)
  return b != null && b.referenced
}

function markFunction(
  path: NodePath<
    | BabelTypes.FunctionDeclaration
    | BabelTypes.FunctionExpression
    | BabelTypes.ArrowFunctionExpression
  >,
  state: PluginState
) {
  const ident = getIdentifier(path)
  if (ident?.node && isIdentifierReferenced(ident)) {
    state.refs.add(ident)
  }
}

function markImport(
  path: NodePath<
    | BabelTypes.ImportSpecifier
    | BabelTypes.ImportDefaultSpecifier
    | BabelTypes.ImportNamespaceSpecifier
  >,
  state: PluginState
) {
  const local = path.get('local')
  if (isIdentifierReferenced(local)) {
    state.refs.add(local)
  }
}

type PluginState = {
  refs: Set<NodePath<BabelTypes.Identifier>>
  opts: PluginOpts
  hasExportsToRemove: boolean
}

export default function pageExportsTransforms({
  types: t,
}: {
  types: typeof BabelTypes
}): PluginObj<PluginState> {
  return {
    visitor: {
      VariableDeclarator(path, state) {
        if (path.node.id.type !== 'Identifier') {
          return
        }

        const local = path.get('id') as NodePath<BabelTypes.Identifier>
        if (isIdentifierReferenced(local)) {
          state.refs.add(local)
        }
      },

      // @ts-ignore
      FunctionDeclaration: markFunction,
      // @ts-ignore
      FunctionExpression: markFunction,
      // @ts-ignore
      ArrowFunctionExpression: markFunction,
      // @ts-ignore
      ImportSpecifier: markImport,
      // @ts-ignore
      ImportDefaultSpecifier: markImport,
      // @ts-ignore
      ImportNamespaceSpecifier: markImport,

      ExportNamedDeclaration(path, state: PluginState) {
        const insertIndicator = (
          path: NodePath<BabelTypes.ExportNamedDeclaration>,
          exportName: string
        ) => {
          if (state.opts.buildTarget === 'static' && exportName === GET_SERVER_SIDE_PROPS_INDICATOR) {
            throw new Error(`You can't use ${EXPORT_GET_SERVER_SIDE_PROPS} when build target is set to "static"`)
          }

          path.insertBefore(
            t.exportNamedDeclaration(
              t.variableDeclaration('var', [
                t.variableDeclarator(
                  t.identifier(exportName),
                  t.booleanLiteral(true)
                ),
              ])
            )
          )
        }

        let shouldRemove = false

        // Handle re-exports
        path.node.specifiers = path.node.specifiers.filter(spec => {
          const { name } = spec.exported
          for (const pattern of exportPatterns) {
            if (name === pattern.input) {
              insertIndicator(path, pattern.output)
              return false
            }
          }

          return true
        })

        const { declaration } = path.node

        // When none of Re-exports left, remove the path
        if (!declaration && path.node.specifiers.length === 0) {
          shouldRemove = true
        }

        if (declaration && declaration.type === 'VariableDeclaration') {
          declaration.declarations = declaration.declarations.filter(
            (declarator: BabelTypes.VariableDeclarator) => {
              for (const pattern of exportPatterns) {
                if (
                  (declarator.id as BabelTypes.Identifier).name ===
                  pattern.input
                ) {
                  insertIndicator(path, pattern.output)
                  return false
                }
              }
              return true
            }
          )
          if (declaration.declarations.length === 0) {
            shouldRemove = true
          }
        }

        if (declaration && declaration.type === 'FunctionDeclaration') {
          for (const pattern of exportPatterns) {
            if (declaration.id.name === pattern.input) {
              shouldRemove = true
              insertIndicator(path, pattern.output)
            }
          }
        }

        if (shouldRemove) {
          state.hasExportsToRemove = true
          path.remove()
        }
      },

      Program: {
        enter(path, state: PluginState) {
          state.refs = new Set()
          state.hasExportsToRemove = false
        },

        exit(path, state: PluginState) {
          if (!state.hasExportsToRemove) {
            // No need to clean unused references then
            return
          }

          const refs = state.refs

          let count: number

          function sweepFunction(
            path: NodePath<
              | BabelTypes.FunctionDeclaration
              | BabelTypes.FunctionExpression
              | BabelTypes.ArrowFunctionExpression
            >
          ) {
            const ident = getIdentifier(path)
            if (
              ident?.node &&
              refs.has(ident) &&
              !isIdentifierReferenced(ident)
            ) {
              ++count

              if (
                t.isAssignmentExpression(path.parentPath) ||
                t.isVariableDeclarator(path.parentPath)
              ) {
                path.parentPath.remove()
              } else {
                path.remove()
              }
            }
          }

          function sweepImport(
            path: NodePath<
              | BabelTypes.ImportSpecifier
              | BabelTypes.ImportDefaultSpecifier
              | BabelTypes.ImportNamespaceSpecifier
            >
          ) {
            const local = path.get('local')
            if (refs.has(local) && !isIdentifierReferenced(local)) {
              ++count
              path.remove()
              if (
                (path.parent as BabelTypes.ImportDeclaration).specifiers
                  .length === 0
              ) {
                path.parentPath.remove()
              }
            }
          }

          // Traverse again to remove unused dependencies
          // We do this at least once
          // If something is removed `count` will be true so it will run again
          // Otherwise it exists the loop
          do {
            // @ts-ignore
            path.scope.crawl()
            count = 0

            path.traverse({
              VariableDeclarator(path) {
                if (path.node.id.type !== 'Identifier') {
                  return
                }

                const local = path.get('id') as NodePath<BabelTypes.Identifier>
                if (refs.has(local) && !isIdentifierReferenced(local)) {
                  ++count
                  path.remove()
                }
              },
              // @ts-ignore
              FunctionDeclaration: sweepFunction,
              // @ts-ignore
              FunctionExpression: sweepFunction,
              // @ts-ignore
              ArrowFunctionExpression: sweepFunction,
              // @ts-ignore
              ImportSpecifier: sweepImport,
              // @ts-ignore
              ImportDefaultSpecifier: sweepImport,
              // @ts-ignore
              ImportNamespaceSpecifier: sweepImport,
            })
          } while (count)
        },
      },
    },
  }
}
