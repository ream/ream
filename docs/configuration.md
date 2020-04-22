# Configuration

## `env`

- Type: `object`

Use compile-time environment variables, matched variables in your app code will be replaced with supplied value.

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

## `chainWebpack`

Extend webpack config using [webpack-chain](https://github.com/neutrinojs/webpack-chain).

```js
module.exports = {
  chainWebpack(config, { isClient, isDev }) {
    // Disable sourcemaps forever
    config.devtool(false)
  }
}
```