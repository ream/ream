---
sidebar: auto
---

# Configuration

## Config Files

### Config File Resolving

Ream resolves following config files from your project root:

- `ream.config.js`
- `ream.config.ts`

The most basic config file looks like this:

```ts
// ream.config.js
export default {
  // ...your config
}
```

### Config Intellisense

If you're using `ream.config.js`:

```js
/**
 * @type {import('ream').ReamConfig}
 */
const config = {
  // ...
}

export default config
```

Or `ream.config.ts`:

```ts
import { defineReamConfig } from 'ream'

export default defineReamConfig({
  // ...your config
})
```

All config options are documented below.

## Options

### `clientRoutes`

- Type: `(defaultRoutes: Route[]) => Route[] | Promise<Route[]>`

```ts
type Route = {
  name?: string
  // Route path
  path: string
  // Absolute path to the file
  file: string
}
```

Extending the default client routes.

```ts
export default {
  clientRoutes(defaultRoutes) {
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

### `apiRoutes`

Like `clientRoutes` but for the backend server.

### `plugins`

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

### `imports`

- Type: `string[]`

Prepend some `import` statements to both server and client entries, which can be useful to importing global CSS or adding some polyfills.

Example:

```js
export default {
  imports: ['./some-polyfill'],
}
```

### `vite`

Extend Ream's internal [Vite config](https://vitejs.dev/config/).

```js
export default {
  vite(config, { dev }) {
    // Mutate the config object here
  },
}
```
