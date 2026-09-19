const mongoose = require('mongoose');
const ProductModel = require('../models/product.model');
const {uploadImage} = require('../services/imagekit.service');
const { invalidateProductCaches } = require('../services/cache.service');
const { emitProductUpdated } = require('../services/product-events.service');

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

        const product = await ProductModel.create({ title, description, price, seller, image: images });
        res.status(201).json({
            message: 'Product created successfully',
            data: product
        });
        
	} catch (err) {
        next(err);
	}
}

async function getProducts(req, res) {

    const {q,minPrice,maxPrice,skip=0,limit=20}=req.query;

    const filter={};

    if(q){
        filter.$text={$search:q};
    }
    if(minPrice){
        filter['price.amount']={...filter['price.amount'],$gte:parseFloat(minPrice)};
    }
    if(maxPrice){
        filter['price.amount']={...filter['price.amount'],$lte:parseFloat(maxPrice)};
    }
    const products = await ProductModel.find(filter)
        .skip(parseInt(skip))
        .limit(Math.min(parseInt(limit),20));

    return res.status(200).json({data:products});
}
async function getProductById(req, res) {
    const { id } = req.params;

        const product = await ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
}
else {
        return res.status(200).json({ data: product });
    }
}

async function updateProduct(req, res) {

    const { id } = req.params;
    const allowedUpdates = ['title', 'description', 'price'];

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (Object.keys(req.body).every(key => !allowedUpdates.includes(key))) {
        return res.status(400).json({ message: 'At least one product field is required' });
    }

    const product = await ProductModel.findOne({
        _id: id,
        seller: req.user._id,
    });
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    for(const key of Object.keys(req.body)){
        if(allowedUpdates.includes(key)){
            if(key==='price'&& typeof req.body.price==='object'){
                if(req.body.price.amount){
                    product.price.amount=parseFloat(req.body.price.amount);
                }
                if(req.body.price.currency){
                    product.price.currency=req.body.price.currency;
                }
            }else{
                product[key]=req.body[key];
            }
        }
    
}
    await product.save();
    await invalidateProductCaches(id);
    emitProductUpdated(product);

    return res.status(200).json({"message": "Product updated successfully", product });
}
async function deleteProduct(req, res) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await ProductModel.findById(id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    if (product.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    await ProductModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Product deleted successfully' });
}
async function getProductBySeller(req, res) {
    const seller = req.user;

    const{skip=0,limit=20}=req.query;
    
    const products = await ProductModel.find({ seller: seller._id })
        .skip(parseInt(skip))
        .limit(Math.min(parseInt(limit),20));

        return res.status(200).json({ data: products });
}

module.exports = { createProduct, getProducts, getProductById, updateProduct,deleteProduct, getProductBySeller };
    
