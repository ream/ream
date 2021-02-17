import { h, defineComponent } from 'vue'
import { usePreloadResult } from '@ream/app'
import { useHead } from '@ream/app'

export default defineComponent({
  name: 'DefaultError',
  setup() {
    useHead({ title: 'Error' })

    const result = usePreloadResult()
    const { error } = result.value
    return () =>
      h(
        'div',
        {
          style: {
            border: `1px solid red`,
            padding: `20px`,
            maxWidth: `600px`,
            margin: `20px auto`,
          },
        },
        [
          h(
            'div',
            {
              style: {
                color: `red`,
              },
            },
            [`Error: ${error.statusCode}`]
          ),
          h(
            'pre',
            {
              style: {
                overflow: `auto`,
              },
            },
            [error.stack]
          ),
        ]
      )
  },
})
