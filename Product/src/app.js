const express=require('express');
const cookieParser=require('cookie-parser');
const multer = require('multer');
const ProductRoutes=require('./routes/product.routes');

const app=express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/products',ProductRoutes);

app.use((error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		const message = error.code === 'LIMIT_UNEXPECTED_FILE'
			? 'Use the image field and upload no more than 5 files'
			: error.message;

		return res.status(400).json({ message, code: error.code });
	}

	if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
		return res.status(400).json({ message: 'Invalid price JSON' });
	}

	if (error.name === 'ValidationError') {
		return res.status(400).json({
			message: 'Product validation failed',
			errors: Object.values(error.errors).map(({ path, message }) => ({ path, message })),
		});
	}

	console.error('Product API error:', error);
	res.status(500).json({ message: 'Internal server error' });
});

module.exports=app;