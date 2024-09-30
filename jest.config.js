module.exports = {
    testMatch: ['**/test/**/*.test.[jt]s?(x)'],  // Look for tests in 'test' directory
    moduleFileExtensions: ['js', 'ts', 'json'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    testEnvironment: 'node',
  };