# Server Routes

Ream allows you to build your API alongside regular Vue pages by having files like `**/*.json.{js,ts}`, `api/**/*.{js,ts}` in `src/routes` folder and export a request handler as follows:

```js
// src/routes/api/hello.js
export default (req, res) => {
  res.end(`hello`)
}
```

Now visit `/api/hello` and you'll see `hello`.

The request handler receives the following parameters:

- `req`: An instance of `http.IncomingMessage`,
- `res`: An instance of `http.ServerResponse`, plus some helper functions you can see [here](#response-helpers)

## Response Helpers

The response (`res`) includes a set of Express.js-like methods to improve the developer experience and increase the speed of creating new API endpoints, take a look at the following example:

The included helpers are:

- `res.status(code)` - A function to set the status code. code must be a valid HTTP status code
- `res.send(body)` - Sends the HTTP response. `body` can be a `string`, an `object`, a `NodeJS.ReadableStream` or a `Buffer`.
