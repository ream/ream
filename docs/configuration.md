# Configuration

## `env`

- Type: `object`

Use build-time environment variables, matched variables in your app code will be replaced with supplied value.

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

Then you can use `process.env.API_ENDPOINT` in your app code.

## `plugins`

[TODO]

## `css`

- Type: `string[]`

Use global CSS.

Example:

```js
module.exports = {
  css: ['bulma/css/bulma.css', '@/css/style.css'],
}
```

Webpack alias also work here.

## `vite`

Extend Ream's internal [Vite config](https://vitejs.dev/config/).

```js
module.exports = {
  vite(config, { ssr, dev }) {
    // Mutate the config object here
  },
}
```
