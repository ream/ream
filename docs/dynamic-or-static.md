# Dynamic or Static

## Server-rendered sites

By default the site produced by Ream needs to be served as a Node.js server, or run in a serverless environment like AWS lambda. However for pages where you don't use [`getServerSideProps`](/docs/data-fetching#getstaticprops), Ream will automatically pre-render them into static HTML files at build time. The default behavior is great for having a site where only specific pages need to be dynamically rendered on each request.

__Notes__:

- You __can__ still use [`getStaticProps`](/docs/data-fetching#getstaicprops) on statically rendered pages to fetch data for prendering. 
- Route query is only accessible on the client-side, it will be an empty object during pre-rendering at build time.

## Static sites

Sometimes you don't need to (or can't) dynamically render a website, so Ream also offers the functionality to fully export you website to static files.

To do so you need to run `ream export` after running `ream build`, your project will be built and exported to `out` folder, then you can deploy this folder to any static site hosting service like [GitHub Pages](https://pages.github.com), [ZEIT Now](https://zeit.co), [Netlify](https://netlify.com) or [Render](https://render.com).