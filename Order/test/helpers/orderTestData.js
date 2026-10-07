const mongoose = require('mongoose');

const buyerId = new mongoose.Types.ObjectId().toString();
const otherBuyerId = new mongoose.Types.ObjectId().toString();
const sellerId = new mongoose.Types.ObjectId().toString();
const otherSellerId = new mongoose.Types.ObjectId().toString();
const productId = new mongoose.Types.ObjectId().toString();
const orderId = new mongoose.Types.ObjectId().toString();

function createOrderFixture(overrides = {}) {
  return {
    _id: orderId,
    user: buyerId,
    status: 'PENDING',
    items: [
      {
        product: productId,
        seller: sellerId,
        quantity: 2,
        price: { amount: 20, currency: 'USD' },
      },
    ],
    timeline: [
      { status: 'PENDING', at: '2026-10-01T10:00:00.000Z' },
    ],
    paymentSummary: {
      status: 'AUTHORIZED',
      amount: { amount: 40, currency: 'USD' },
      capturedAt: null,
    },
    shippingAddress: {
      street: '10 Market Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      pincode: '94105',
    },
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

module.exports = {
  buyerId,
  createOrderFixture,
  orderId,
  otherBuyerId,
  otherSellerId,
  productId,
  sellerId,
};