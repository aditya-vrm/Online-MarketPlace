jest.mock('../src/models/product.model', () => ({
    find: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/product.model');

process.env.JWT_SECRET = 'test-secret';

const sellerId = '507f1f77bcf86cd799439012';

function authToken(userId = sellerId, role = 'seller') {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET);
}

describe('GET /api/products/seller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when no authentication token is provided', async () => {
        const response = await request(app).get('/api/products/seller');

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
        expect(Product.find).not.toHaveBeenCalled();
    });

    it('returns 403 when the authenticated user is not a seller', async () => {
        const response = await request(app)
            .get('/api/products/seller')
            .set('Authorization', `Bearer ${authToken(sellerId, 'admin')}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ message: 'Forbidden' });
        expect(Product.find).not.toHaveBeenCalled();
    });

    it('lists only products owned by the authenticated seller', async () => {
        const products = [
            { _id: 'product-1', title: 'Desk lamp', seller: sellerId },
            { _id: 'product-2', title: 'Chair', seller: sellerId },
        ];
        const limit = jest.fn().mockResolvedValue(products);
        const skip = jest.fn().mockReturnValue({ limit });
        Product.find.mockReturnValue({ skip });

        const response = await request(app)
            .get('/api/products/seller')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ data: products });
        expect(Product.find).toHaveBeenCalledWith({ seller: sellerId });
    });

    it('supports skip and limit pagination for the seller product list', async () => {
        const limit = jest.fn().mockResolvedValue([]);
        const skip = jest.fn().mockReturnValue({ limit });
        Product.find.mockReturnValue({ skip });

        const response = await request(app)
            .get('/api/products/seller')
            .query({ skip: '10', limit: '5' })
            .set('Authorization', `Bearer ${authToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ data: [] });
        expect(Product.find).toHaveBeenCalledWith({ seller: sellerId });
        expect(skip).toHaveBeenCalledWith(10);
        expect(limit).toHaveBeenCalledWith(5);
    });
});
