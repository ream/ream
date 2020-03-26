---
title: Routing
---

---

Routes live inside the `./routes` folder.

## Client routes

Client routes are `.vue` files that export Vue components.

## Server routes

Server routes are `.js` or `.ts` files that export HTTP request handlers:

```js
export default (req, res) => {
  res.send({ hello: true })
}
```
