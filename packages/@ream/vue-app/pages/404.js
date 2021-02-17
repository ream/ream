import { h } from 'vue'
import { useHead } from 'ream/head'

export default {
  name: 'NotFound',
  setup() {
    useHead({ title: '404 Not Found' })

    return () =>
      h(
        'div',
        {
          style: {
            border: `1px solid #e2e2e2`,
            padding: `20px`,
            maxWidth: `600px`,
            margin: `20px auto`,
            textAlign: `center`,
          },
        },
        `404 | This page could not be found.`
      )
  },
}
