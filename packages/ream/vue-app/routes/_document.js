export default ({ head, main, scripts, htmlAttrs, bodyAttrs }) => {
  return `
  <html${htmlAttrs()}>
    <head>
      ${head()}
    </head>
    <body${bodyAttrs()}>
      ${main()}
      ${scripts()}
    </body>
  </html>
  `
}
