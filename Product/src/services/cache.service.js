async function invalidateProductCaches(productId) {
    return Promise.all([
        cache.delete(`product:${productId}`),
        cache.delete('products:list'),
    ]);
}

const cache = {
    delete: async () => undefined,
};

module.exports = { cache, invalidateProductCaches };
