const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
        binary: {
            version: '6.0.12',
        },
    });

    const uri = mongoServer.getUri();

    process.env.MONGODB_URL = uri;
    process.env.MONGO_URI = uri;

    await mongoose.connect(uri);
});

beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB is not connected');
    }

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});
