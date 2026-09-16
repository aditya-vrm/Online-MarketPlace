jest.mock('../src/db/redis', () => ({
    set: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
}));