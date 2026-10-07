const { body, validationResult } = require('express-validator');

const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const createOrderValidation = [
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress.street').isString().trim().notEmpty().withMessage('Street is required'),
    body('shippingAddress.city').isString().trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.state').isString().trim().notEmpty().withMessage('State is required'),
    body('shippingAddress.country').isString().trim().notEmpty().withMessage('Country is required'),
    body('shippingAddress').custom((val) => {
        if (!val.pincode && !val.zip) {
            throw new Error('Pincode or zip is required');
        }
        return true;
    }),
    respondWithValidationErrors
];

const updateAddressValidation = [
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress.street').isString().trim().notEmpty().withMessage('Street cannot be empty'),
    body('shippingAddress.city').isString().trim().notEmpty().withMessage('City cannot be empty'),
    body('shippingAddress.state').isString().trim().notEmpty().withMessage('State cannot be empty'),
    body('shippingAddress.country').isString().trim().notEmpty().withMessage('Country cannot be empty'),
    body('shippingAddress').custom((val) => {
        if (!val.pincode && !val.zip) {
            throw new Error('Pincode or zip is required');
        }
        return true;
    }),
    respondWithValidationErrors
];

module.exports = { createOrderValidation, updateAddressValidation };