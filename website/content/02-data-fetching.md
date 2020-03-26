---
title: Data fetching
---

---

## getServerSideProps

You can export a function called `getServerSideProps` in route components, and it will be executed on each request on the server side.

```vue
<script>
export const getServerSideProps = async ({ req }) => {
  const { database } = await import('./my-database-orm')
  const user = await database.findUserById(req.params.user_id)
  return {
    props: {
      user
    }
  }
}

export default {
  props: ['user']
}
</script>
```

## getStaticProps

Like `getServerSideProps`, but `getStaticProps` is only executed at build time, we store the data as JSON file and the app will automatically request the JSON file instead at runtime.

When to use this:

- Your data won't change frequently.
- Your data isn't user-specific.
- You want to serve your app as a static site.

## getStaticPaths

[TODO]
