const path = require('path')

module.exports = {
    collectCoverage: false,
    collectCoverageFrom: ['./src/controllers/**/*.js', './src/models/**/*.js', ],
    coverageDirectory: './public/coverage',
    testTimeout: 10000,
    testEnvironment: 'node',
    modulePathIgnorePatterns: [
      '__tests__/fixtures',
      // '__tests__/CustomSequencer.js'
    ],
    coveragePathIgnorePatterns: [
      '/node_modules/'
    ],
    coverageReporters: ['lcov'],
    // testSequencer: path.join(__dirname, '__tests__', 'CustomSequencer.js')
  }
  