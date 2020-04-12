export default (req, res) => {
  res.send({
    posts: [
      {
        title: 'Hello'
      },
      {
        title: 'Bye'
      }
    ]
  })
}