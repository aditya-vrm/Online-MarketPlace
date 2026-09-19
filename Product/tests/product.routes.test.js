jest.mock('../src/models/product.model', () => ({
    create: jest.fn(),
}));
jest.mock('../src/middlewares/auth.middleware', () => () => (req, res, next) => {
    req.user = { _id: 'seller-id', role: 'seller' };
    next();
});
jest.mock('../src/services/imagekit.service', () => ({
    uploadImage: jest.fn().mockResolvedValue({
        url: 'https://example.com/lamp.jpg',
        thumbnailUrl: 'https://example.com/lamp-thumb.jpg',
        id: 'image-id',
    }),
}));

const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/product.model');

describe('POST /api/products/', () => {
    beforeEach(() => {
        Product.create.mockResolvedValue({
            _id: 'product-id',
            title: 'Desk lamp',
            description: 'A warm desk lamp',
            price: { amount: 25, currency: 'USD' },
            seller: 'seller-id',
            image: [{
                url: 'https://example.com/lamp.jpg',
                thumbnailUrl: 'https://example.com/lamp-thumb.jpg',
                id: 'image-id',
            }],
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('creates a product from a multipart request with an image', async () => {
        const response = await request(app)
            .post('/api/products/')
            .field('title', 'Desk lamp')
            .field('description', 'A warm desk lamp')
            .field('priceAmount', '25')
            .field('priceCurrency', 'USD')
            .attach('image', Buffer.from('fake-image'), 'lamp.jpg');

        expect(response.statusCode).toBe(201);
        expect(response.body.data).toMatchObject({ title: 'Desk lamp' });
        expect(Product.create).toHaveBeenCalledWith({
            title: 'Desk lamp',
            description: 'A warm desk lamp',
            price: { amount: 25, currency: 'USD' },
            seller: 'seller-id',
            image: [{
                url: 'https://example.com/lamp.jpg',
                thumbnailUrl: 'https://example.com/lamp-thumb.jpg',
                id: 'image-id',
            }],
        });
    });

    it('rejects a missing or invalid price before creating a product', async () => {
        const response = await request(app)
            .post('/api/products/')
            .field('title', 'Desk lamp')
            .field('priceAmount', '-5');

        expect(response.statusCode).toBe(400);
        expect(response.body).toMatchObject({ message: 'Validation failed' });
        expect(Product.create).not.toHaveBeenCalled();
    });
});