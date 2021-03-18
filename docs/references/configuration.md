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

## `plugins`

- Type: `ReamPlugin[]`

Use Ream plugins. e.g.

```ts
import ga from '@ream/plugin-google-analytics'

export default {
  plugin: [ga()],
  env: {
    REAM_GA_TRACKING_ID: 'UA-XXX-XXX',
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
  vite(config, { ssr }) {
    // Mutate the config object here
  },
}
```
