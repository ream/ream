export const getPort = async (host = 'localhost', port?: number) => {
  if (!port) {
    throw new Error(`You need to provide "port" option when initializing Ream`)
  }
  // TODO: maybe ensure the port is available
  process.env.PORT = String(port)
  process.env.HOST = host
  return { host, port }
}
