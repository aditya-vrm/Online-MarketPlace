const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const userModel = require('../src/Model/user.model');

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
    await userModel.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});