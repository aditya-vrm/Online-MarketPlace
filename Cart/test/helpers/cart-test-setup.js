require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');

const authToken = jwt.sign({ userId: 'test-user' }, process.env.JWT_SECRET);

const products = {
  available: {
    id: '507f1f77bcf86cd799439011',
    price: 12.5,
    available: true,
    stock: 10,
  },
  second: {
    id: '507f1f77bcf86cd799439012',
    price: 7,
    available: true,
    stock: 5,
  },
  unavailable: {
    id: '507f1f77bcf86cd799439013',
    price: 4,
    available: false,
    stock: 0,
  },
};

const productService = {
  getProduct: jest.fn(),
  reserveStock: jest.fn(),
  releaseStock: jest.fn(),
};

const requestWithAuth = (method, path) => {
  const apiPath = path.startsWith('/api/') ? path : `/api${path}`;
  return request(app)[method](apiPath).set('Cookie', `token=${authToken}`);
};

const cart = () => ({
  get: (path) => requestWithAuth('get', path),
  post: (path) => requestWithAuth('post', path),
  patch: (path) => requestWithAuth('patch', path),
  delete: (path) => requestWithAuth('delete', path),
});

const setupCartTest = () => {
  beforeAll(() => {
    app.locals.productService = productService;
    app.locals.reserveStock = true;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    app.locals.carts = new Map();
    productService.getProduct.mockImplementation(async (productId) => {
      return Object.values(products).find((product) => product.id === productId) || null;
    });
    productService.reserveStock.mockResolvedValue({ reserved: true });
    productService.releaseStock.mockResolvedValue({ released: true });

    await cart().delete('/cart');
  });
};

module.exports = { app, cart, productService, products, setupCartTest };