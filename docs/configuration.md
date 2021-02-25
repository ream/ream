# Configuration

Supported configuration file for Ream: `ream.config.ts` or `ream.config.js`, export the config object like this:

```ts
// ream.config.js

export default {
  // ...your config
}
```

Or with TypeScript:unit

```ts
// ream.config.ts
import { ReamConfig } from 'ream'

const config: ReamConfig = {
  // ...your config
}

export default config
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

## `plugins`

- Type: `ReamPlugin[]`

Use Ream plugins. e.g.

```ts
import ga from '@ream/plugin-google-analytics'

export default {
  plugins: [ga()],
}
```

## `imports`

- Type: `string[]`

Prepend some `import` statements to both server and client entries, which can be useful to importing global CSS or adding some polyfills.

Example:

```js
module.exports = {
  imports: ['./some-polyfill'],
}
```

## `vite`

Extend Ream's internal [Vite config](https://vitejs.dev/config/).

```js
module.exports = {
  vite(config, { ssr, dev }) {
    // Mutate the config object here
  },
}
```
