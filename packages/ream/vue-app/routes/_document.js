export default ({ head, main, script, htmlAttrs, headAttrs, bodyAttrs }) => {
  return `
  <html${htmlAttrs()}>
    <head>
      ${head()}
    </head>
    <body${bodyAttrs()}>
      ${main()}
      ${script()}
    </body>
  </html>
  `
}
