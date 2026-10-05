const { cart, products, setupCartTest } = require('./helpers/cart-test-setup');

describe('PATCH /cart/items/:productId', () => {
  setupCartTest();

  beforeEach(async () => {
    await cart().post('/cart/items').send({ productId: products.available.id, qty: 2 });
  });

  test('changes the quantity and returns recalculated totals', async () => {
    const response = await cart()
      .patch(`/cart/items/${products.available.id}`)
      .send({ qty: 4 });

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({ qty: 4, lineTotal: 50 }),
    );
    expect(response.body.subtotal).toBe(50);
    expect(response.body.total).toBe(50);
  });

  test.each([0, -1])('removes the item when qty is %s or less', async (qty) => {
    const response = await cart()
      .patch(`/cart/items/${products.available.id}`)
      .send({ qty });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  test('rejects a quantity that exceeds available stock', async () => {
    const response = await cart()
      .patch(`/cart/items/${products.available.id}`)
      .send({ qty: products.available.stock + 1 });

    expect(response.status).toBe(409);
  });

  test('returns not found for a product that is not in the cart', async () => {
    const response = await cart()
      .patch(`/cart/items/${products.second.id}`)
      .send({ qty: 2 });

    expect(response.status).toBe(404);
  });
});