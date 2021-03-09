# Configuration

Supported configuration file for Ream: `ream.config.ts` or `ream.config.js`, export the config object like this:

```ts
// ream.config.js
export default {
  // ...your config
}
```

Or with TypeScript:

```ts
// ream.config.ts
import { defineReamConfig } from 'ream'

export default defineReamConfig({
  // ...your config
})
```

All config options are documented below.

## `env`

- Type: `object`

Use build-time environment variables, matched variables in your app code will be replaced with the supplied value.

For example:

```js
module.exports = {
  env: {
    API_ENDPOINT:
      process.env.NODE_ENV === 'production'
        ? 'https://api.my.com'
        : 'http://localhost:4040',
  },
}
```

Then you can use `import.meta.env.API_ENDPOINT` in your app code.

`.env` files are also supported.

## `routes`

- Type: `(defaultRoutes: Route[]) => Route[] | Promise<Route[]>`

```ts
type Route = AppRoute | ServerRoute

// A route for the Vue app
type AppRoute = {
  name?: string
  path: string
  file: string
  children?: AppRoute[]
}

// A route for server
type ServerRoute = {
  path: string
  file: string
  isServerRoute: true
}
```

Routes returned by this function will be used as app routes and server routes, for example:

```ts
export default {
  routes(defaultRoutes) {
    return [
      ...defaultRoutes,
      {
        path: '/foo',
        file: path.join(__dirname, './views/Foo.vue'),
      },
      {
        path: '/api',
        file: path.join(__dirname, './server/api.ts'),
        isServerRoute: true,
      },
    ]
  },
}
```

## `modules`

- Type: `string[]`

Use Ream modules. e.g.

```ts
export default {
  modules: ['@ream/module-google-analytics'],
  env: {
    GA_TRACKING_ID: 'UA-XXX-XXX',
  },
}
```

## `imports`

- Type: `string[]`

Prepend some `import` statements to both server and client entries, which can be useful to importing global CSS or adding some polyfills.

Example:

```js
export default {
  imports: ['./some-polyfill'],
}
```

## `vite`

Extend Ream's internal [Vite config](https://vitejs.dev/config/).

```js
export default {
  vite(config, { ssr, dev }) {
    // Mutate the config object here
  },
}
```
