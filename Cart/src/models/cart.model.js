const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    qty: {
        type: Number,
        min: 1,
        default: 1,
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1,
    },
    price: {
        type: Number,
        default: 0,
    },
    lineTotal: {
        type: Number,
        default: 0,
    },
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
    },
    items: [cartItemSchema],
}, { timestamps: true });

const cartModel = mongoose.model('cart', cartSchema);

module.exports = cartModel;