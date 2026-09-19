const express = require('express');
const multer = require('multer');
const productController = require('../controller/product.controller');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const { validateProduct } = require('../validators/product.validation');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
// POST /api/products 
router.post('/', createAuthMiddleware(['admin', 'seller']), upload.array('image', 5), validateProduct, productController.createProduct);
// GET /api/products
router.get('/', productController.getProducts);
// PATCH /api/products/:id
router.patch('/:id', createAuthMiddleware(['seller']), productController.updateProduct);
//DELETE /api/products/:id
router.delete('/:id', createAuthMiddleware(['seller']), productController.deleteProduct);
// GET /api/products/seller
router.get('/seller', createAuthMiddleware(['seller']), productController.getProductBySeller);
//GET /api/products/:id
router.get('/:id', productController.getProductById);

module.exports = router;
