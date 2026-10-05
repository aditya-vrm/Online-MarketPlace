const { body, validationResult } = require('express-validator');

const sendValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return next();
};

const validateAddItemToCart = [
    body('productId').isMongoId().withMessage('Product ID must be valid'),
    body('qty').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    sendValidationErrors,
];

const validateUpdateItemInCart = [
    body('qty').isInt().withMessage('Quantity must be an integer'),
    sendValidationErrors,
];

module.exports = { validateAddItemToCart, validateUpdateItemInCart };