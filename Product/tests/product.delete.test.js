jest.mock('../src/models/product.model', () => ({
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/product.model');

process.env.JWT_SECRET = 'test-secret';

const productId = '507f1f77bcf86cd799439011';
const sellerId = '507f1f77bcf86cd799439012';
const anotherSellerId = '507f1f77bcf86cd799439013';

function authToken(userId = sellerId, role = 'seller') {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET);
}

describe('DELETE /api/products/:id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when no authentication token is provided', async () => {
        const response = await request(app).delete(`/api/products/${productId}`);

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
        expect(Product.findById).not.toHaveBeenCalled();
        expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('returns 403 when the authenticated user is not a seller', async () => {
        const response = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${authToken(sellerId, 'admin')}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ message: 'Forbidden' });
        expect(Product.findById).not.toHaveBeenCalled();
        expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('returns 400 for an invalid product id', async () => {
        const response = await request(app)
            .delete('/api/products/not-a-valid-id')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid product ID' });
        expect(Product.findById).not.toHaveBeenCalled();
        expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('returns 404 when the product does not exist', async () => {
        Product.findById.mockResolvedValue(null);

        const response = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${authToken()}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ message: 'Product not found' });
        expect(Product.findById).toHaveBeenCalledWith(productId);
        expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('returns 403 when the product belongs to another seller', async () => {
        Product.findById.mockResolvedValue({
            _id: productId,
            seller: anotherSellerId,
        });

        const response = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${authToken()}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ message: 'Forbidden' });
        expect(Product.findById).toHaveBeenCalledWith(productId);
        expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('deletes the seller product and returns 200 with confirmation', async () => {
        Product.findById.mockResolvedValue({
            _id: productId,
            seller: sellerId,
        });
        Product.findByIdAndDelete.mockResolvedValue({ _id: productId });

        const response = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${authToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Product deleted successfully' });
        expect(Product.findById).toHaveBeenCalledWith(productId);
        expect(Product.findByIdAndDelete).toHaveBeenCalledWith(productId);
    });
});
