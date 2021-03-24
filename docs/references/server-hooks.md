# Server Hooks

Server hooks are used to extend the functionality of the back-end server, they are available in `ream.server.js` and `ream.server.ts` in the root directory.

## `extendServer`

- Arguments:
  - `context`: `object`
    - `server`: The server instance.
- Returns:
  - `void` `Promise<void>`

Called when the server instance has been created, often used to add additional middlewares.

## `getInitialHTML`

- Arguments:
  - `context`: `object`
    - `head`: `string`
    - `main`: `string`
    - `scripts`: `string`
    - `htmlAttrs`: `string`
    - `bodyAttrs`: `string`
- Returns:
  - `string` `Promise<string>`: Return the HTML string
  - `undefined` `Promise<undefined>`: Returns `undefined` if don't want to modify the final HTML, you can still modify the `context` object.

Used to generate final `<html>` string.
