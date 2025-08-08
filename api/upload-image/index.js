// api/upload-image/index.js
const { BlobServiceClient } = require("@azure/storage-blob");
const busboy = require("busboy");
const { v4: uuidv4 } = require('uuid');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "images";

if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("Azure Storage Connection String is not defined");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

const parseMultipartFormData = (req) => {
    return new Promise((resolve, reject) => {
        const bb = busboy({ headers: req.headers });
        const result = { fields: {}, file: null, filename: '', contentType: '' };

        bb.on('file', (name, file, info) => {
            const { filename, mimeType } = info;
            const chunks = [];
            file.on('data', (data) => chunks.push(data));
            file.on('end', () => {
                result.file = Buffer.concat(chunks);
                result.filename = filename;
                result.contentType = mimeType;
            });
        });

        bb.on('field', (name, val) => result.fields[name] = val);
        bb.on('close', () => resolve(result));
        bb.on('error', (err) => reject(err));
        
        if (req.body instanceof Buffer) {
            bb.end(req.body);
        } else {
            reject(new Error("Request body is not a Buffer"));
        }
    });
};

module.exports = async function (context, req) {
    try {
        const { file, filename, contentType } = await parseMultipartFormData(req);

        if (!file) {
            return context.res = { status: 400, body: "No file uploaded." };
        }

        const blobName = `${uuidv4()}-${filename}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.upload(file, file.length, {
            blobHTTPHeaders: { blobContentType: contentType }
        });

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { imageUrl: blockBlobClient.url }
        };

    } catch (error) {
        context.log.error("Image upload failed:", error);
        // フロントエンドに、より詳細なエラー情報を返すように変更
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { message: `画像アップロードAPIでエラーが発生しました: ${error.message}` }
        };
    }
};
