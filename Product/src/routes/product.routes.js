const express = require('express');
const multer = require('multer');
const productController = require('../controller/product.controller');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const { validateProduct } = require('../validators/product.validation');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', createAuthMiddleware(['admin', 'seller']), upload.array('image', 5), validateProduct, productController.createProduct);

module.exports = router;
