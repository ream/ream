module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['@sucrase/jest-plugin'],
  },
  transformIgnorePatterns: ['/node_modules/', '/dist/'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/types/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
