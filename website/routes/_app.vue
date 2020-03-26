<script>
export default {
  props: ['Component', 'pageProps'],

  head: {
    title: 'Ream',
  },

  render(h) {
    const {Component, pageProps} = this
    return h(Component, {
      props: pageProps
    })
  }
}
</script>

<style src="~/css/prism.css"></style>
<style src="~/css/global.css"></style>