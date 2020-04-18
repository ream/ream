export function getAssetFileName({
  isDev,
  isClient,
}: {
  isDev: boolean
  isClient: boolean
}) {
  const useHash = !isDev
  return {
    js: isClient
      ? useHash
        ? 'js/[name].[chunkhash:6].js'
        : 'js/[name].js'
      : '[name].js',
    css: useHash ? 'css/[name].[chunkhash:6].css' : 'css/[name].css',
    font: useHash ? 'fonts/[name].[hash:6].[ext]' : 'fonts/[path][name].[ext]',
    image: useHash
      ? 'images/[name].[hash:6].[ext]'
      : 'images/[path][name].[ext]',
  }
}
