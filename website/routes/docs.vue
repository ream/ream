<template>
  <div>
    <DocsHeader />
    <div class="container mx-auto px-2">
      <div class="flex -mx-2">
        <DocsSidebar :docItems="docItems" />
        <DocsMain :docItems="docItems" />
      </div>
    </div>
  </div>
</template>

<script>
import DocsHeader from '~/components/DocsHeader.vue'
import DocsSidebar from '~/components/DocsSidebar.vue'
import DocsMain from '~/components/DocsMain.vue'

export const getStaticProps = async ({ fetch }) => {
  const docItems = await fetch(`/docs.json`).then(res => res.json())
  return {
    props: {
      docItems
    }
  }
}

export default {
  components: {
    DocsHeader,
    DocsSidebar,
    DocsMain
  },

  props: ['docItems'],

  head() {
    return {
      title: `Docs - Ream`,
      bodyAttrs: {
        class: `bg-brown-lightest`
      }
    }
  }
}
</script>

