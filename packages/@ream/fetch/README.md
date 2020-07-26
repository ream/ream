# @ream/fetch

This lib polyfills `fetch` in Node.js and browser and do not change their behavior.

For enhanced version you should import `ream/fetch` in your app instead, which will throw a `FetchError` when response status is not success, the error contains a [`response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object.
