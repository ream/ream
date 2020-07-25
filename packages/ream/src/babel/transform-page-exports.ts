// Thanks to https://github.com/vercel/next.js/blob/574fe0b582d5cc1b13663121fd47a3d82deaaa17/packages/next/build/babel/plugins/next-ssg-transform.ts
// Modified heavily
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// !!!!!!!! Someone please help me remove the `@ts-ignore` in this file !!!!!!!!!!!
//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import { PluginObj, NodePath, types as BabelTypes } from '@babel/core'
import {
  SERVER_PRELOAD_INDICATOR,
  GET_STATIC_PROPS_INDICATOR,
  GET_STATIC_PATHS_INDICATOR,
} from './constants'

const EXPORT_SERVER_PRELOAD = `serverPreload`
const EXPORT_GET_STATIC_PATHS = `getStaticPaths`

type DATA_EXPORT_ID =
  | typeof EXPORT_SERVER_PRELOAD
  | typeof EXPORT_GET_STATIC_PATHS

const exportPatterns: Array<{
  input: DATA_EXPORT_ID
  output:
    | typeof SERVER_PRELOAD_INDICATOR
    | typeof GET_STATIC_PROPS_INDICATOR
    | typeof GET_STATIC_PATHS_INDICATOR
}> = [
  {
    input: EXPORT_SERVER_PRELOAD,
    output: SERVER_PRELOAD_INDICATOR,
  },
  {
    input: EXPORT_GET_STATIC_PATHS,
    output: GET_STATIC_PATHS_INDICATOR,
  },
]

export type PluginOpts = {}

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
  if (b?.referenced) {
    // Functions can reference themselves, so we need to check if there's a
    // binding outside the function scope or not.
    if (b.path.type === 'FunctionDeclaration') {
      return !b.constantViolations
        .concat(b.referencePaths)
        // Check that every reference is contained within the function:
        .every((ref) => ref.findParent((p) => p === b.path))
    }

    return true
  }
  return false
}

const createMarkFunction = (state: PluginState) =>
  function markFunction(
    path: NodePath<
      | BabelTypes.FunctionDeclaration
      | BabelTypes.FunctionExpression
      | BabelTypes.ArrowFunctionExpression
    >
  ) {
    const ident = getIdentifier(path)
    if (ident?.node && isIdentifierReferenced(ident)) {
      state.refs.add(ident)
    }
  }

const createMarkImport = (state: PluginState) =>
  function markImport(
    path: NodePath<
      | BabelTypes.ImportSpecifier
      | BabelTypes.ImportDefaultSpecifier
      | BabelTypes.ImportNamespaceSpecifier
    >
  ) {
    const local = path.get('local')
    if (isIdentifierReferenced(local)) {
      state.refs.add(local)
    }
  }

type PluginState = {
  refs: Set<NodePath<BabelTypes.Identifier>>
  opts: PluginOpts
  dataExports: Set<DATA_EXPORT_ID>
}

export default function pageExportsTransforms({
  types: t,
}: {
  types: typeof BabelTypes
}): PluginObj<PluginState> {
  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.refs = new Set()
          state.dataExports = new Set()

          const markImport = createMarkImport(state)
          const markFunction = createMarkFunction(state)

          path.traverse({
            // No idea why the second argument is always undefine
            // It should have been `state`
            VariableDeclarator(variablePath) {
              if (variablePath.node.id.type === 'Identifier') {
                const local = variablePath.get('id') as NodePath<
                  BabelTypes.Identifier
                >
                if (isIdentifierReferenced(local)) {
                  state.refs.add(local)
                }
              } else if (variablePath.node.id.type === 'ObjectPattern') {
                const pattern = variablePath.get('id') as NodePath<
                  BabelTypes.ObjectPattern
                >

                const properties = pattern.get('properties')
                properties.forEach((p) => {
                  const local = p.get(
                    p.node.type === 'ObjectProperty'
                      ? 'value'
                      : p.node.type === 'RestElement'
                      ? 'argument'
                      : (function () {
                          throw new Error('invariant')
                        })()
                  ) as NodePath<BabelTypes.Identifier>
                  if (isIdentifierReferenced(local)) {
                    state.refs.add(local)
                  }
                })
              } else if (variablePath.node.id.type === 'ArrayPattern') {
                const pattern = variablePath.get('id') as NodePath<
                  BabelTypes.ArrayPattern
                >

                const elements = pattern.get('elements')
                elements.forEach((e) => {
                  let local: NodePath<BabelTypes.Identifier>
                  if (e.node?.type === 'Identifier') {
                    local = e as NodePath<BabelTypes.Identifier>
                  } else if (e.node?.type === 'RestElement') {
                    local = e.get('argument') as NodePath<BabelTypes.Identifier>
                  } else {
                    return
                  }

                  if (isIdentifierReferenced(local)) {
                    state.refs.add(local)
                  }
                })
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

            ExportNamedDeclaration(path) {
              const insertIndicator = (
                path: NodePath<BabelTypes.ExportNamedDeclaration>,
                exportName: string
              ) => {
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
              path.node.specifiers = path.node.specifiers.filter((spec) => {
                const { name } = spec.exported
                for (const pattern of exportPatterns) {
                  if (name === pattern.input) {
                    insertIndicator(path, pattern.output)
                    state.dataExports.add(pattern.input)
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
                        state.dataExports.add(pattern.input)
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
                    state.dataExports.add(pattern.input)
                    insertIndicator(path, pattern.output)
                  }
                }
              }

              if (shouldRemove) {
                path.remove()
              }
            },
          })

          if (state.dataExports.size === 0) {
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
            ;(path.scope as any).crawl()
            count = 0

            path.traverse({
              VariableDeclarator(variablePath) {
                if (variablePath.node.id.type === 'Identifier') {
                  const local = variablePath.get('id') as NodePath<
                    BabelTypes.Identifier
                  >
                  if (refs.has(local) && !isIdentifierReferenced(local)) {
                    ++count
                    variablePath.remove()
                  }
                } else if (variablePath.node.id.type === 'ObjectPattern') {
                  const pattern = variablePath.get('id') as NodePath<
                    BabelTypes.ObjectPattern
                  >

                  const beforeCount = count
                  const properties = pattern.get('properties')
                  properties.forEach((p) => {
                    const local = p.get(
                      p.node.type === 'ObjectProperty'
                        ? 'value'
                        : p.node.type === 'RestElement'
                        ? 'argument'
                        : (function () {
                            throw new Error('invariant')
                          })()
                    ) as NodePath<BabelTypes.Identifier>

                    if (refs.has(local) && !isIdentifierReferenced(local)) {
                      ++count
                      p.remove()
                    }
                  })

                  if (
                    beforeCount !== count &&
                    pattern.get('properties').length < 1
                  ) {
                    variablePath.remove()
                  }
                } else if (variablePath.node.id.type === 'ArrayPattern') {
                  const pattern = variablePath.get('id') as NodePath<
                    BabelTypes.ArrayPattern
                  >

                  const beforeCount = count
                  const elements = pattern.get('elements')
                  elements.forEach((e) => {
                    let local: NodePath<BabelTypes.Identifier>
                    if (e.node?.type === 'Identifier') {
                      local = e as NodePath<BabelTypes.Identifier>
                    } else if (e.node?.type === 'RestElement') {
                      local = e.get('argument') as NodePath<
                        BabelTypes.Identifier
                      >
                    } else {
                      return
                    }

                    if (refs.has(local) && !isIdentifierReferenced(local)) {
                      ++count
                      e.remove()
                    }
                  })

                  if (
                    beforeCount !== count &&
                    pattern.get('elements').length < 1
                  ) {
                    variablePath.remove()
                  }
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
