const express = require('express');
const router = express.Router();
const createMiddleware = require('../middleware/auth.middleware');
const cartController = require('../controller/cart.controller');
const validate = require('../middleware/validation.middleware');

router.get('/', createMiddleware(['user']), cartController.getCart);

router.post('/items', validate.validateAddItemToCart, createMiddleware(['user']), cartController.addItemToCart);

router.patch('/items/:productId', validate.validateUpdateItemInCart, createMiddleware(['user']), cartController.updateItemQuantity);

router.delete('/items/:productId', createMiddleware(['user']), cartController.deleteItemFromCart);

router.delete('/', createMiddleware(['user']), cartController.clearCart);

module.exports = router;