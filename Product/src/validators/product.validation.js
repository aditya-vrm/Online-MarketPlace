const { body, validationResult } = require('express-validator');

async function handleValidationErrors(req, res, next){
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Validation failed',
				errors: errors.array().map(({ path, msg }) => ({ path, message: msg })),
			});
		}

		next();
	}

const validateProduct = [
	body('title')
		.trim()
		.notEmpty()
		.withMessage('Title is required')
		.isLength({ max: 120 })
		.withMessage('Title must be 120 characters or fewer'),
	body('description')
		.optional({ values: 'falsy' })
		.trim()
		.isLength({ max: 2000 })
		.withMessage('Description must be 2000 characters or fewer'),
	body('priceAmount')
		.trim()
		.notEmpty()
		.withMessage('Price amount is required')
		.isFloat({ gt: 0 })
		.withMessage('Price amount must be a number greater than 0'),
	body('priceCurrency')
		.optional({ values: 'falsy' })
		.isIn(['USD', 'INR'])
		.withMessage('Price currency must be USD or INR'),
	handleValidationErrors
];

module.exports = { validateProduct };