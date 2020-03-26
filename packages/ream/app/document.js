export default ({
  head,
  headAttrs,
  bodyAttrs,
  htmlAttrs,
  scripts,
  app,
}) => {
  return `
  <html ${htmlAttrs}>

  <head ${headAttrs}>
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1"/>
    <meta charSet="utf-8"/>
    ${head}
  </head>
  
  <body ${bodyAttrs}>
    ${app}
    ${scripts}
  </body>
  
  </html>
  `
}