import { h, defineComponent } from 'vue'
import { useServerError, useHead } from '../'

export default defineComponent({
  name: 'DefaultError',
  setup() {
    useHead({ title: 'Error' })

    const error = useServerError()
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
            [`Error: ${error.value.statusCode}`]
          ),
          error.value.message &&
            h(
              'pre',
              {
                style: {
                  overflow: `auto`,
                },
              },
              [error.value.message]
            ),
        ]
      )
  },
})
