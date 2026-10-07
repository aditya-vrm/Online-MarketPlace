const mongoose = require('mongoose');

function createMockDatabase() {
  return { carts: [], products: [], inventory: [], orders: [] };
}

function seedOrderData(database) {
  const userId = new mongoose.Types.ObjectId().toString();
  const productId = new mongoose.Types.ObjectId().toString();

  database.carts.push({
    userId,
    items: [{ productId, quantity: 2 }],
    shipping: { amount: 5, currency: 'USD' },
  });
  database.products.push({
    _id: productId,
    price: { amount: 20, currency: 'USD' },
    taxRate: 0.08,
  });
  database.inventory.push({ productId, available: 10, reserved: 0 });

  return { userId, productId };
}

module.exports = { createMockDatabase, seedOrderData };