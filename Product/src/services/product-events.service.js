const { EventEmitter } = require('events');

const productEvents = new EventEmitter();

function emitProductUpdated(product) {
    productEvents.emit('product.updated', product);
}

module.exports = { productEvents, emitProductUpdated };
