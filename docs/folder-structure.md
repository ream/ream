# Folder Structure

```
.
├── .ream/
├── public/
├── pages/
├── enhance-app.js
└── ream.config.js
```

- `.ream`: **Automatically generated**. The files in this folder are used by Saber internally and they are not meant for modification. Should be added to the `.gitignore`.
  - `.ream/client` contains the generated static assets of your website, if you are running the command `ream export`, you should deploy `.ream/client` then.
- `public/`: (optional) Served as public assets under the root path, e.g. `public/favicon.ico` is served at url `/favicon.ico`.
- `pages/`: (optional) Vue Components under this folder become pages automatically with paths based on their filename, see more about [Routing](/docs/routing). Files inside `pages/api` are treated as [Server Routes](/docs/server-routes).
  - `pages/404.vue`: (optional) Custom 404 page.
  - `pages/_error.vue`: (optional) Custom error page.
  - `pages/_app.vue`: (optional) [Custom App Component](/docs/custom-app-and-document).
- `ream.config.js`, `ream.config.ts`: (optional) Config file for Ream, see [all config options here](/docs/configuration).
- `enhance-app.js`, `enhance-app.ts`: (optional) Access [app hooks](/docs/app-hooks).

## Source Directory

`pages`, `enhance-app.js` are resolved from the source directory, by default it's the same as the root directory of your project, but if you move pages folder to `src/pages` then we will use `src` as source direcotry instead.

```
.
├── .ream/
├── public/
├── src/pages/
├── src/enhance-app.js
└── ream.config.js
```
