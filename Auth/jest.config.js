module.exports = {
    testMatch: ['<rootDir>/__tests__/**/*.test.js'],
    setupFiles: ['<rootDir>/test/redis.mock.js'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};