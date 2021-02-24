module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': '@sucrase/jest-plugin',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/types/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
