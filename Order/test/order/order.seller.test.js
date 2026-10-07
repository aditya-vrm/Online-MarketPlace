const request = require('supertest');
const app = require('../../src/app');
const { getAuthCookie } = require('../setup/auth');
const { otherSellerId, sellerId } = require('../helpers/orderTestData');

describe('GET /api/orders/seller', () => {
  it('returns the seller orders with only that seller items and applies status/date filters', async () => {
    const response = await request(app)
      .get('/api/orders/seller?status=SHIPPED&from=2026-10-01&to=2026-10-31')
      .set('Cookie', getAuthCookie({ userId: sellerId, extra: { role: 'seller' } }))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.orders).toEqual(expect.any(Array));
    for (const order of response.body.orders) {
      expect(order.status).toBe('SHIPPED');
      expect(new Date(order.createdAt).getTime()).toBeGreaterThanOrEqual(Date.parse('2026-10-01'));
      expect(new Date(order.createdAt).getTime()).toBeLessThan(Date.parse('2026-11-01'));
      expect(order.items.length).toBeGreaterThan(0);
      expect(order.items.every((item) => item.seller === sellerId)).toBe(true);
      expect(order.items.some((item) => item.seller === otherSellerId)).toBe(false);
    }
  });

  it('supports status-only and date-only filters', async () => {
    const response = await request(app)
      .get('/api/orders/seller?status=PENDING&from=2026-10-01')
      .set('Cookie', getAuthCookie({ userId: sellerId, extra: { role: 'seller' } }))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.orders).toEqual(expect.any(Array));
    expect(response.body.orders.every((order) => order.status === 'PENDING')).toBe(true);
    expect(response.body.orders.every((order) => order.items.every((item) => item.seller === sellerId))).toBe(true);
  });

  it('rejects a customer account', async () => {
    const response = await request(app)
      .get('/api/orders/seller')
      .set('Cookie', getAuthCookie({ userId: sellerId, extra: { role: 'user' } }))
      .expect('Content-Type', /json/)
      .expect(403);

    expect(response.body.message).toBeDefined();
  });
});