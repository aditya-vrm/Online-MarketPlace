const CartModel = require('../models/cart.model');

async function getUserCart(req) {
    const carts = req.app.locals.carts;
    const userId = req.user?.id || req.user?.userId || req.user?._id || req.user?.sub;
    const key = String(userId);

    if (carts) {
        if (!carts.has(key)) {
            carts.set(key, { user: userId, userId, items: [] });
        }
        return carts.get(key);
    }

    let cart = await CartModel.findOne({
        $or: [{ user: userId }, { userId }],
    });

    if (!cart) {
        cart = new CartModel({ user: userId, userId, items: [] });
    }
    return cart;
}

async function saveUserCart(req, cart) {
    if (!req.app.locals.carts && typeof cart.save === 'function') {
        await cart.save();
    }
}

function serializeCart(cart) {
    const rawItems = cart.items || [];
    const items = rawItems.map((item) => {
        const qty = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
        const price = item.price || 0;
        const lineTotal = item.lineTotal !== undefined ? item.lineTotal : qty * price;
        const productId = (item.productId?._id || item.productId || '').toString();

        return {
            productId,
            qty,
            price,
            lineTotal,
        };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
        items,
        subtotal,
        total: subtotal,
    };
}

async function getProduct(req, productId) {
    const productService = req.app.locals.productService;
    if (productService) {
        return productService.getProduct(productId.toString());
    }

    try {
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001/api/products';
        const response = await fetch(`${productServiceUrl}/${productId}`);
        if (!response.ok) {
            return null;
        }
        const result = await response.json();
        const prod = result.data || result;
        if (!prod) return null;

        return {
            id: prod._id?.toString() || prod.id?.toString() || productId.toString(),
            productId: prod._id?.toString() || prod.id?.toString() || productId.toString(),
            stock: prod.stock ?? 0,
            price: typeof prod.price === 'object' && prod.price !== null ? prod.price.amount : (prod.price ?? 0),
            available: prod.available !== undefined ? prod.available : ((prod.stock ?? 0) > 0),
        };
    } catch (err) {
        return null;
    }
}

async function releaseStock(req, productId, qty) {
    const productService = req.app.locals.productService;
    if (qty > 0 && productService?.releaseStock) {
        await productService.releaseStock(productId.toString(), qty);
    }
}

async function getCart(req, res) {
    try {
        const cart = await getUserCart(req);
        for (const item of cart.items) {
            const product = await getProduct(req, item.productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            const price = typeof product.price === 'object' ? product.price.amount : product.price;
            const qty = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
            item.price = price;
            item.qty = qty;
            item.quantity = qty;
            item.lineTotal = qty * price;
        }
        await saveUserCart(req, cart);
        return res.status(200).json(serializeCart(cart));
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
}

async function addItemToCart(req, res) {
    try {
        const productId = (req.body.productId || req.body.productid || '').toString();
        const qty = req.body.qty !== undefined ? req.body.qty : req.body.quantity;

        const product = await getProduct(req, productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.available === false) {
            return res.status(409).json({ message: 'Product is unavailable' });
        }

        const cart = await getUserCart(req);
        const existingItem = cart.items.find((item) => item.productId.toString() === productId);
        const existingQty = existingItem ? (existingItem.qty !== undefined ? existingItem.qty : existingItem.quantity || 0) : 0;
        const nextQty = existingQty + qty;

        if (nextQty > product.stock) {
            return res.status(409).json({ message: 'Insufficient stock' });
        }

        if (req.app.locals.reserveStock && req.app.locals.productService?.reserveStock) {
            const reservation = await req.app.locals.productService.reserveStock(productId, qty);
            if (reservation?.reserved === false) {
                return res.status(409).json({ message: 'Insufficient stock' });
            }
        }

        const productPrice = typeof product.price === 'object' ? product.price.amount : product.price;
        if (existingItem) {
            existingItem.qty = nextQty;
            existingItem.quantity = nextQty;
            existingItem.price = productPrice;
            existingItem.lineTotal = nextQty * productPrice;
        } else {
            cart.items.push({
                productId,
                qty,
                quantity: qty,
                price: productPrice,
                lineTotal: qty * productPrice,
            });
        }

        await saveUserCart(req, cart);
        return res.status(201).json(serializeCart(cart));
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
}

async function updateItemQuantity(req, res) {
    try {
        const productId = (req.params.productId || '').toString();
        const qty = req.body.qty !== undefined ? req.body.qty : req.body.quantity;

        const cart = await getUserCart(req);
        const item = cart.items.find((entry) => entry.productId.toString() === productId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        const currentQty = item.qty !== undefined ? item.qty : item.quantity || 0;

        if (qty <= 0) {
            await releaseStock(req, item.productId, currentQty);
            cart.items = cart.items.filter((entry) => entry !== item && entry.productId.toString() !== productId);
            await saveUserCart(req, cart);
            return res.status(200).json(serializeCart(cart));
        }

        const product = await getProduct(req, item.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.available === false || qty > product.stock) {
            return res.status(409).json({ message: 'Insufficient stock' });
        }

        if (qty > currentQty && req.app.locals.reserveStock && req.app.locals.productService?.reserveStock) {
            await req.app.locals.productService.reserveStock(item.productId.toString(), qty - currentQty);
        } else if (qty < currentQty) {
            await releaseStock(req, item.productId.toString(), currentQty - qty);
        }

        const productPrice = typeof product.price === 'object' ? product.price.amount : product.price;
        item.qty = qty;
        item.quantity = qty;
        item.price = productPrice;
        item.lineTotal = qty * productPrice;

        await saveUserCart(req, cart);
        return res.status(200).json(serializeCart(cart));
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
}

async function deleteItemFromCart(req, res) {
    try {
        const productId = (req.params.productId || '').toString();
        const cart = await getUserCart(req);
        const item = cart.items.find((entry) => entry.productId.toString() === productId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        const currentQty = item.qty !== undefined ? item.qty : item.quantity || 0;
        await releaseStock(req, item.productId, currentQty);
        cart.items = cart.items.filter((entry) => entry !== item && entry.productId.toString() !== productId);
        await saveUserCart(req, cart);
        return res.status(200).json(serializeCart(cart));
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
}

async function clearCart(req, res) {
    try {
        const cart = await getUserCart(req);
        await Promise.all((cart.items || []).map((item) => {
            const currentQty = item.qty !== undefined ? item.qty : item.quantity || 0;
            return releaseStock(req, item.productId, currentQty);
        }));
        cart.items = [];
        await saveUserCart(req, cart);
        return res.status(200).json(serializeCart(cart));
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
}

module.exports = {
    addItemToCart,
    updateItemQuantity,
    updateItemInCart: updateItemQuantity,
    getCart,
    delete: deleteItemFromCart,
    deleteItemFromCart,
    clearCart,
};