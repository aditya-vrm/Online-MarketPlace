jest.mock('../src/models/product.model', () => ({
    findOne: jest.fn(),
}));
jest.mock('../src/middlewares/auth.middleware', () => () => (req, res, next) => {
    req.user = { _id: 'seller-id', role: 'seller' };
    next();
});
jest.mock('../src/services/cache.service', () => ({
    invalidateProductCaches: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/product-events.service', () => ({
    emitProductUpdated: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/product.model');
const { invalidateProductCaches } = require('../src/services/cache.service');
const { emitProductUpdated } = require('../src/services/product-events.service');

describe('PATCH /api/products/:id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('updates seller-owned product fields, invalidates caches, and emits product.updated', async () => {
        const updatedProduct = {
            _id: '507f1f77bcf86cd799439011',
            title: 'Updated lamp',
            description: 'A brighter desk lamp',
            price: { amount: 30, currency: 'USD' },
            seller: 'seller-id',
            save: jest.fn().mockResolvedValue(undefined),
        };
        Product.findOne.mockResolvedValue(updatedProduct);

        const response = await request(app)
            .patch('/api/products/507f1f77bcf86cd799439011')
            .send({
                title: 'Updated lamp',
                description: 'A brighter desk lamp',
                price: { amount: 30, currency: 'USD' },
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            message: 'Product updated successfully',
            product: {
                _id: updatedProduct._id,
                title: updatedProduct.title,
                description: updatedProduct.description,
                price: updatedProduct.price,
                seller: updatedProduct.seller,
            },
        });
        expect(Product.findOne).toHaveBeenCalledWith({
            _id: '507f1f77bcf86cd799439011',
            seller: 'seller-id',
        });
        expect(updatedProduct.save).toHaveBeenCalled();
        expect(invalidateProductCaches).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(emitProductUpdated).toHaveBeenCalledWith(updatedProduct);
    });

    it('returns 404 and does not invalidate or emit when the product is not seller-owned', async () => {
        Product.findOne.mockResolvedValue(null);

        const response = await request(app)
            .patch('/api/products/507f1f77bcf86cd799439011')
            .send({ title: 'Updated lamp' });

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ message: 'Product not found' });
        expect(invalidateProductCaches).not.toHaveBeenCalled();
        expect(emitProductUpdated).not.toHaveBeenCalled();
    });

    it('rejects an empty update', async () => {
        const response = await request(app)
            .patch('/api/products/507f1f77bcf86cd799439011')
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ message: 'At least one product field is required' });
        expect(Product.findOne).not.toHaveBeenCalled();
    });
});
