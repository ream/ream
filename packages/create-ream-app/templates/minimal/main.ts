export default () => {
  if (import.meta.env.SSR) {
    return { html: `<div id="_ream"></div>`, head: `<title>My App</title>` }
  }

  const el = document.createElement('div')
  el.textContent = 'hello'
  document.getElementById('_ream')!.appendChild(el)
}
