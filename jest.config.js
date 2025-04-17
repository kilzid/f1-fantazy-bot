module.exports = {
  // Specify that tests run in a Node environment
  testEnvironment: 'node',

  // Enable code coverage collection
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js', // Collect coverage from all JavaScript files in the src directory
    '!src/bot.js', // Exclude the entry point bot file
    '!src/**/index.js', // Exclude index files
  ],
  coverageDirectory: 'coverage',

  // Optionally enforce a minimum coverage threshold
  // todo: kilzi: set coverage threshold
  coverageThreshold: {
    global: {
      branches: 58,
      functions: 59,
      lines: 78,
      statements: 79,
    },
  },
};
