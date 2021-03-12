# Folder Structure

```
.
├── .ream/
├── public/
├── pages/
├── ream.app.js
├── ream.server.js
└── ream.config.js
```

- `.ream`: **Automatically generated**. The files in this folder are used by Saber internally and they are not meant for modification. Should be added to the `.gitignore`.
  - `.ream/client` contains the generated static assets of your website, if you are running the command `ream export`, you should deploy `.ream/client` then.
- `public/`: (optional) Served as public assets under the root path, e.g. `public/favicon.ico` is served at url `/favicon.ico`.
- `pages/`: (optional) Vue Components under this folder become pages automatically with paths based on their filename, see more about [Routing](/docs/routing). Files inside `pages/api` are treated as [Server Routes](/docs/server-routes).
  - `pages/404.vue`: (optional) [Custom 404 page](/docs/special-pages#custom-404-page).
  - `pages/_error.vue`: (optional) [Custom error page](/docs/special-pages#custom-error-page).
  - `pages/_app.vue`: (optional) [Custom app component](/docs/special-pages#custom-app-component).
- `ream.config.js`, `ream.config.ts`: (optional) Config file for Ream, see [all config options here](/docs/configuration).
- `ream.app.js`, `ream.app.ts`: (optional) Access [app hooks](/docs/references/app-hooks).
- `ream.server.js`, `ream.server.ts`: (optional) Access [server hooks](/docs/references/server-hooks).

## Source Directory

`pages` folder is resolved from the source directory, by default it's the same as the root directory of your project, but if you move pages folder to `src/pages` then we will use `src` as source direcotry instead.

```
.
├── .ream/
├── public/
├── src/pages/
├── ream.app.js
└── ream.config.js
```

A Vite alias `@` is also pointed to the source directory so you can use a shortcut like `@/some-path` to import files in the source directory.
