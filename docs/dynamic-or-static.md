# Dynamic or Static

## Server-rendered sites

By default the site produced by Ream needs to be served as a Node.js server, or run in a serverless environment like AWS lambda. But pages that don't use `preload` or `serverPreload` will be statically generated at build time or at the first time being requested.

This is the best way to make some pages "static" while keeping other pages server-rendered if you need.

## Static sites

Sometimes you don't need to (or can't) dynamically render a website, so Ream also offers the functionality to fully export you website to static files.

To do so you need to change your build script from `ream build` to `ream export`, your project will be built and exported to `.ream/export` folder, then you can deploy this folder to any static site hosting service like [GitHub Pages](https://pages.github.com), [ZEIT Now](https://zeit.co), [Netlify](https://netlify.com) or [Render](https://render.com).

Note that while using `ream export`, you don't have to use the [`staticPaths`](/docs/data-fetching#static-paths) option because Ream will crawl `<a>` elements on every page, so pages with dynamic routes will be covered if they are referenced in other pages.
