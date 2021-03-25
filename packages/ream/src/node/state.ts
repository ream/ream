export type State = {
  constants: {
    [k: string]: string
  }
}

export const getInitialState = (): State => {
  const state: State = {
    constants: {},
  }

  return state
}
