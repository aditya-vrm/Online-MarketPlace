jest.mock('../src/models/product.model', () => ({
    find: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/product.model');

describe('GET /api/products/', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns products with the default pagination', async () => {
        const products = [
            { _id: 'product-1', title: 'Desk lamp', price: { amount: 25, currency: 'USD' } },
            { _id: 'product-2', title: 'Chair', price: { amount: 50, currency: 'USD' } },
        ];
        const limit = jest.fn().mockResolvedValue(products);
        const skip = jest.fn().mockReturnValue({ limit });
        Product.find.mockReturnValue({ skip });

        const response = await request(app).get('/api/products/');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ data: products });
        expect(Product.find).toHaveBeenCalledWith({});
        expect(skip).toHaveBeenCalledWith(0);
        expect(limit).toHaveBeenCalledWith(20);
    });

    it('applies search, price, and pagination query parameters', async () => {
        const limit = jest.fn().mockResolvedValue([]);
        const skip = jest.fn().mockReturnValue({ limit });
        Product.find.mockReturnValue({ skip });

        const response = await request(app)
            .get('/api/products/')
            .query({ q: 'lamp', minPrice: '10', maxPrice: '100', skip: '5', limit: '10' });

        expect(response.statusCode).toBe(200);
        expect(Product.find).toHaveBeenCalledWith({
            $text: { $search: 'lamp' },
            'price.amount': { $gte: 10, $lte: 100 },
        });
        expect(skip).toHaveBeenCalledWith(5);
        expect(limit).toHaveBeenCalledWith(10);
    });
});
