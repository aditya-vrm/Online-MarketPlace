const { cart, productService, products, setupCartTest } = require('./helpers/cart-test-setup');

describe('POST /cart/items', () => {
  setupCartTest();

  test('adds an available product and returns recalculated totals', async () => {
    const response = await cart()
      .post('/cart/items')
      .send({ productId: products.available.id, qty: 2 });

    expect(response.status).toBe(201);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        productId: products.available.id,
        qty: 2,
        price: products.available.price,
        lineTotal: 25,
      }),
    ]);
    expect(response.body.subtotal).toBe(25);
    expect(response.body.total).toBe(25);
  });

  test('rejects an unavailable product', async () => {
    const response = await cart()
      .post('/cart/items')
      .send({ productId: products.unavailable.id, qty: 1 });

    expect(response.status).toBe(409);
  });

  test('rejects a quantity that exceeds available stock', async () => {
    const response = await cart()
      .post('/cart/items')
      .send({ productId: products.available.id, qty: products.available.stock + 1 });

    expect(response.status).toBe(409);
  });

  test.each([
    [{}, 'missing productId'],
    [{ productId: products.available.id }, 'missing qty'],
    [{ productId: products.available.id, qty: 0 }, 'zero qty'],
    [{ productId: products.available.id, qty: -1 }, 'negative qty'],
    [{ productId: products.available.id, qty: 1.5 }, 'fractional qty'],
  ])('rejects invalid input: %s', async (payload) => {
    const response = await cart().post('/cart/items').send(payload);

    expect(response.status).toBe(400);
  });

  test('ignores a client-supplied price and uses Product Service price', async () => {
    const response = await cart()
      .post('/cart/items')
      .send({ productId: products.available.id, qty: 2, price: 0.01 });

    expect(response.status).toBe(201);
    expect(response.body.items[0].price).toBe(products.available.price);
    expect(response.body.subtotal).toBe(25);
  });

  test('reserves stock when stock reservation is enabled', async () => {
    await cart().post('/cart/items').send({ productId: products.available.id, qty: 2 });

    expect(productService.reserveStock).toHaveBeenCalledWith(products.available.id, 2);
  });
});