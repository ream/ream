<template>
  <div>{{ message }}</div>
</template>

<script>
import fs from 'fs'

export const getStaticProps = async () => {
  const message = await fs.promises.readFile(__dirname + '/message.txt', 'utf8')
  return {
    props: {
      message
    }
  }
}

export default {
  props: ['message']
}
</script>