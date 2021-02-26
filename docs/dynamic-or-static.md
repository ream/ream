# Dynamic or Static

## Server-rendered sites

By default the site produced by Ream needs to be served as a Node.js server, or run in a serverless environment like AWS lambda / Vercel etc. And pages that don't use `preload` will always be statically generated at build time.

This is the best way to make some pages "static" while keeping other pages server-rendered if you need.

## Static sites

Sometimes you want to host your website on a static-site hosting service like GitHub Pages, so Ream also offers the functionality to fully export your website to static HTML/CSS/JS files.

To do so you need to run `ream export` instead of `ream build` while building your website, your project will be built and exported to `.ream/client` folder, then you can deploy this folder to any static-site hosting service like [GitHub Pages](https://pages.github.com), [ZEIT Now](https://zeit.co), [Netlify](https://netlify.com) or [Render](https://render.com).

Note that while using `ream export`, you don't have to use the [`getStaticPaths`](/docs/data-fetching#static-preload-with-dynamic-routes) because Ream will crawl `<a>` elements on every page, so pages with dynamic path will be covered if they are referenced in other pages.
