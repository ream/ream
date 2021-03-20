module.exports = {
  title: 'Ream',
  description: 'A toolkit for building web apps',
  themeConfig: {
    sidebar: [
      {
        text: 'Guide',
        children: [
          { text: 'What is Ream', link: '/' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Folder Structure', link: '/guide/folder-structure' },
          { text: 'Routing', link: '/guide/routing' },
        ],
      },
    ],
    nav: [
      { text: 'Guide', link: '/', activeMatch: '^/$|^/guide/' },
      {
        text: 'GitHub',
        link: 'https://github.com/ream/ream',
      },
    ],
  },
}
