const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
    },
    zip: {
        type: String,
    },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
        required: true,
    },
    price: {
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            enum: ['USD', 'INR'],
            default: 'USD',
        },
    },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    items: [orderItemSchema],
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'pending', 'CONFIRMED', 'confirmed', 'SHIPPED', 'shipped', 'DELIVERED', 'delivered', 'CANCELLED', 'cancelled'],
        default: 'PENDING',
    },
    totalPrice: {
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            enum: ['USD', 'INR'],
            default: 'USD',
        },
    },
    totalprice: {
        amount: {
            type: Number,
        },
        currency: {
            type: String,
        },
    },
    shippingAddress: {
        type: AddressSchema,
        required: true,
    },
    timeline: [
        {
            type: { type: String },
            status: { type: String },
            at: { type: Date, default: Date.now },
        }
    ],
    paymentSummary: {
        status: { type: String },
        amount: { type: mongoose.Schema.Types.Mixed },
        capturedAt: { type: Date },
    },
}, { timestamps: true });

const orderModel = mongoose.model('order', orderSchema);

module.exports = orderModel;