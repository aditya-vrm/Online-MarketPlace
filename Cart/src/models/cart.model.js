const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            qty: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
                min: 0,
            },
            lineTotal: {
                type: Number,
                required: true,
                min: 0,
            },
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model('cart', cartSchema);