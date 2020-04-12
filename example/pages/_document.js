export default ({ head, main, script, htmlAttrs, headAttrs, bodyAttrs }) => {
  return `
  <html ${htmlAttrs()}>
    <head ${headAttrs()}>
      ${head()}
    </head>
    <body ${bodyAttrs()}>
      ${main()}
      ${script()}
    </body>
  </html>
  `
}
