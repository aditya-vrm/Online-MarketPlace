const Product = require('../models/product.model');
const {uploadImage} = require('../services/imagekit.service');

async function createProduct(req, res, next) {
	try {
		const { title, description, priceAmount, priceCurrency='INR' } = req.body;

        if (!title || !priceAmount) {
            return res.status(400).json({ message: 'Title and priceAmount are required' });
        }
        const seller = req.user._id;

        const price = {
             amount: parseFloat(priceAmount),
              currency: priceCurrency
             };

        const images = await Promise.all(
            (req.files || []).map(file => uploadImage({
                buffer: file.buffer
            }))
        );

        const product = await Product.create({ title, description, price, seller, image: images });
        res.status(201).json({
            message: 'Product created successfully',
            data: product
        });
        
	} catch (err) {
        next(err);
	}
}

module.exports = { createProduct };
