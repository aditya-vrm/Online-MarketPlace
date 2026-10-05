const CartModel = require('../models/cart.model');

async function getUserCart(req) {
    const carts = req.app.locals.carts;
    const userId = req.user.userId || req.user._id || req.user.sub;
    if (carts) {
        const key = String(userId);
        if (!carts.has(key)) {
            carts.set(key, { items: [] });
        }
        return carts.get(key);
    }
    const cart = await CartModel.findOne({ userId });
    return cart || new CartModel({ userId, items: [] });
}

async function saveUserCart(req, cart) {
    if (!req.app.locals.carts) {
        await cart.save();
    }
}

function serializeCart(cart) {
    const items = cart.items.map((item) => ({
        productId: item.productId.toString(),
        qty: item.qty,
        price: item.price,
        lineTotal: item.lineTotal,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items, subtotal, total: subtotal };
}

async function getProduct(req, productId) {
    const productService = req.app.locals.productService;
    return productService ? productService.getProduct(productId.toString()) : null;
}

async function releaseStock(req, productId, qty) {
    const productService = req.app.locals.productService;
    if (qty > 0 && productService?.releaseStock) {
        await productService.releaseStock(productId, qty);
    }
}

async function addItemToCart(req, res) {
    const { productId, qty } = req.body;
    const product = await getProduct(req, productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.available) {
        return res.status(409).json({ message: 'Product is unavailable' });
    }

    const cart = await getUserCart(req);
    const existingItem = cart.items.find((item) => item.productId.toString() === productId);
    const nextQty = (existingItem?.qty || 0) + qty;
    if (nextQty > product.stock) {
        return res.status(409).json({ message: 'Insufficient stock' });
    }

    if (req.app.locals.reserveStock && req.app.locals.productService?.reserveStock) {
        const reservation = await req.app.locals.productService.reserveStock(productId, qty);
        if (reservation?.reserved === false) {
            return res.status(409).json({ message: 'Insufficient stock' });
        }
    }

    if (existingItem) {
        existingItem.qty = nextQty;
        existingItem.price = product.price;
        existingItem.lineTotal = existingItem.qty * product.price;
    } else {
        cart.items.push({ productId, qty, price: product.price, lineTotal: qty * product.price });
    }
    await saveUserCart(req, cart);
    return res.status(201).json(serializeCart(cart));
}

async function getCart(req, res) {
    const cart = await getUserCart(req);
    for (const item of cart.items) {
        const product = await getProduct(req, item.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        item.price = product.price;
        item.lineTotal = item.qty * product.price;
    }
    await saveUserCart(req, cart);
    return res.status(200).json(serializeCart(cart));
}

async function updateItemInCart(req, res) {
    const cart = await getUserCart(req);
    const item = cart.items.find((entry) => entry.productId.toString() === req.params.productId);
    if (!item) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }

    const { qty } = req.body;
    if (qty <= 0) {
        await releaseStock(req, item.productId, item.qty);
        cart.items = cart.items.filter((entry) => entry !== item);
        await saveUserCart(req, cart);
        return res.status(200).json(serializeCart(cart));
    }

    const product = await getProduct(req, item.productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.available || qty > product.stock) {
        return res.status(409).json({ message: 'Insufficient stock' });
    }
    if (qty > item.qty && req.app.locals.reserveStock && req.app.locals.productService?.reserveStock) {
        await req.app.locals.productService.reserveStock(item.productId, qty - item.qty);
    } else if (qty < item.qty) {
        await releaseStock(req, item.productId, item.qty - qty);
    }

    item.qty = qty;
    item.price = product.price;
    item.lineTotal = qty * product.price;
    await saveUserCart(req, cart);
    return res.status(200).json(serializeCart(cart));
}

async function deleteItemFromCart(req, res) {
    const cart = await getUserCart(req);
    const item = cart.items.find((entry) => entry.productId.toString() === req.params.productId);
    if (!item) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }
    await releaseStock(req, item.productId, item.qty);
    cart.items = cart.items.filter((entry) => entry !== item);
    await saveUserCart(req, cart);
    return res.status(200).json(serializeCart(cart));
}

async function clearCart(req, res) {
    const cart = await getUserCart(req);
    await Promise.all(cart.items.map((item) => releaseStock(req, item.productId, item.qty)));
    cart.items = [];
    await saveUserCart(req, cart);
    return res.status(200).json(serializeCart(cart));
}

module.exports = { addItemToCart, clearCart, deleteItemFromCart, getCart, updateItemInCart };
