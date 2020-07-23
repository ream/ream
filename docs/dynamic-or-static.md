# Dynamic or Static

## Server-rendered sites

By default the site produced by Ream needs to be served as a Node.js server, or run in a serverless environment like AWS lambda. Pages can be cached so they will be only rendered on first request.

## Static sites

Sometimes you don't need to (or can't) dynamically render a website, so Ream also offers the functionality to fully export you website to static files.

To do so you need to run `ream export` after running `ream build`, your project will be built and exported to `out` folder, then you can deploy this folder to any static site hosting service like [GitHub Pages](https://pages.github.com), [ZEIT Now](https://zeit.co), [Netlify](https://netlify.com) or [Render](https://render.com).
