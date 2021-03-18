# Folder Structure

## Overview

```
.
├── .ream/
├── public/
├── pages/
├── api/
├── main.js
├── server.js
└── ream.config.js
```

- `.ream`: **Automatically generated**. The files in this folder are used by Saber internally and they are not meant for modification. Should be added to the `.gitignore`.
  - `.ream/client` contains the generated static assets of your website, if you are running the command `ream export`, you should deploy `.ream/client` then.
- `public/`: (optional) Served as public assets under the root path, e.g. `public/favicon.ico` is served at url `/favicon.ico`.
- `pages/`: (optional) Files under this folder become pages automatically with paths based on their filename, see more about [Routing](/docs/routing).
- `main.js`, `main.ts`: The entry file of your app.
- `ream.config.js`, `ream.config.ts`: (optional) Config file for Ream, see [all config options here](/docs/configuration).
- `server.js`, `server.ts`: (optional) Customize the server.

## Source Directory

Everything except `ream.config.js` and `public/` folder is resolved from the source directory, by default source directory is the same as the root directory, you can use a custom source directory like `./src` by setting it in the config file:

```js
export default {
  srcDir: './src',
}
```

A Vite alias `@` is also pointed to the source directory so you can use a shortcut like `@/some-path` to import files in the source directory.
