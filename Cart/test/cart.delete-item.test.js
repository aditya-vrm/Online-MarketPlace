const { cart, products, setupCartTest } = require('./helpers/cart-test-setup');

describe('DELETE /cart/items/:productId', () => {
  setupCartTest();

  test('removes the requested line item', async () => {
    await cart().post('/cart/items').send({ productId: products.available.id, qty: 2 });
    await cart().post('/cart/items').send({ productId: products.second.id, qty: 1 });

    const response = await cart().delete(`/cart/items/${products.available.id}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({ productId: products.second.id, qty: 1 }),
    ]);
    expect(response.body.total).toBe(products.second.price);
  });

  test('returns not found when the requested line does not exist', async () => {
    const response = await cart().delete(`/cart/items/${products.available.id}`);

    expect(response.status).toBe(404);
  });
});