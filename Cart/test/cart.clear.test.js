require('dotenv').config();
const jwt = require('jsonwebtoken');
const { cart, productService, products, setupCartTest } = require('./helpers/cart-test-setup');

const authToken = jwt.sign({ userId: 'test-user' }, process.env.JWT_SECRET);

describe('DELETE /api/cart', () => {
  setupCartTest();

  test('clears every line item and returns an empty cart', async () => {
    await cart()
      .post('/api/cart/items')
      .set('Cookie', `token=${authToken}`)
      .send({ productId: products.available.id, qty: 2 });
    await cart()
      .post('/api/cart/items')
      .set('Cookie', `token=${authToken}`)
      .send({ productId: products.second.id, qty: 1 });

    const response = await cart()
      .delete('/api/cart')
      .set('Cookie', `token=${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], subtotal: 0, total: 0 });
    expect(productService.releaseStock).toHaveBeenCalledWith(products.available.id, 2);
    expect(productService.releaseStock).toHaveBeenCalledWith(products.second.id, 1);
  });
});