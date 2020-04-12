
const {createServer} = require('../packages/ream-server')
const server = createServer(__dirname)

server.listen(4000)
console.log('http://localhost:4000')