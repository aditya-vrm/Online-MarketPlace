const { cart, productService, products, setupCartTest } = require('./helpers/cart-test-setup');

describe('GET /cart', () => {
  setupCartTest();

  test('returns an empty cart when no items exist', async () => {
    const response = await cart().get('/cart');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], subtotal: 0, total: 0 });
  });

  test('recomputes item prices and totals from Product Service', async () => {
    await cart().post('/cart/items').send({ productId: products.available.id, qty: 2 });
    productService.getProduct.mockResolvedValue({ ...products.available, price: 15 });

    const response = await cart().get('/cart');

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        productId: products.available.id,
        qty: 2,
        price: 15,
        lineTotal: 30,
      }),
    ]);
    expect(response.body.subtotal).toBe(30);
    expect(response.body.total).toBe(30);
  });

  test('returns an error when a cart product no longer exists', async () => {
    await cart().post('/cart/items').send({ productId: products.available.id, qty: 1 });
    productService.getProduct.mockResolvedValue(null);

    const response = await cart().get('/cart');

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});