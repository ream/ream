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
          {
            text: 'Environment Variables',
            link: '/guide/environment-variables',
          },
        ],
      },
      {
        text: 'Frameworks',
        children: [
          { text: 'Vue', link: '/frameworks/vue.html' },
          { text: 'React', link: '/frameworks/react.html' },
        ],
      },
    ],
    nav: [
      { text: 'Guide', link: '/', activeMatch: '^/$|^/guide/' },
      { text: 'Config', link: '/config' },
      {
        text: 'GitHub',
        link: 'https://github.com/ream/ream',
      },
    ],
  },
}
