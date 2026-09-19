const ImageKit = require('@imagekit/nodejs').default;
const { toFile } = require('@imagekit/nodejs');
const { randomUUID } = require('crypto');

let imageKitClient;

function getImageKitClient() {
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        throw new Error('IMAGEKIT_PRIVATE_KEY is not configured');
    }

    if (!imageKitClient) {
        imageKitClient = new ImageKit({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        });
    }

    return imageKitClient;
}

async function uploadImage({ buffer, filename, folder = '/products' }) {
    const fileName = filename || `${randomUUID()}.jpg`;
    const result = await getImageKitClient().files.upload({
        file: await toFile(buffer, fileName),
        fileName,
        folder,
    });

    return {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl || result.url,
        id: result.fileId,
    };
}

module.exports = { getImageKitClient, uploadImage };
