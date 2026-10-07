module.exports = {
    testMatch: ['<rootDir>/test/**/*.test.js'],
    setupFiles: ['<rootDir>/test/setup/env.js'],
    setupFilesAfterEnv: ['<rootDir>/test/setup/mongodb.js'],
    testEnvironment: 'node',
};

