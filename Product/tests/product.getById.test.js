jest.mock('../src/models/product.model', () => ({
    findById: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/product.model');

describe('GET /api/products/:id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns a product when the id exists', async () => {
        const product = {
            _id: 'product-1',
            title: 'Desk lamp',
            description: 'A warm desk lamp',
            price: { amount: 25, currency: 'USD' },
            image: [],
        };
        Product.findById.mockResolvedValue(product);

        const response = await request(app).get('/api/products/product-1');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ data: product });
        expect(Product.findById).toHaveBeenCalledWith('product-1');
    });

    it('returns 404 when the product does not exist', async () => {
        Product.findById.mockResolvedValue(null);

        const response = await request(app).get('/api/products/missing-product');

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ message: 'Product not found' });
        expect(Product.findById).toHaveBeenCalledWith('missing-product');
    });
});
