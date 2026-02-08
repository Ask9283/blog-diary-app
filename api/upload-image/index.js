const { BlobServiceClient } = require('@azure/storage-blob');
const busboy = require('busboy');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, unauthorizedResponse } = require('../shared/authMiddleware');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('Azure Storage Connection String is not defined in environment variables.');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

const parseMultipartFormData = (req) => {
    return new Promise((resolve, reject) => {
        const bb = busboy({
            headers: req.headers,
            limits: { fileSize: MAX_FILE_SIZE }
        });
        const result = { fields: {}, file: null, filename: '', contentType: '', truncated: false };

        bb.on('file', (name, file, info) => {
            const { filename, mimeType } = info;
            const chunks = [];
            file.on('data', (data) => chunks.push(data));
            file.on('limit', () => { result.truncated = true; });
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
            reject(new Error('Request body is not a Buffer.'));
        }
    });
};

module.exports = async function (context, req) {
    const auth = verifyToken(req);
    if (!auth.user) {
        context.log.error('Auth failed:', auth.error);
        context.res = unauthorizedResponse(auth.error);
        return;
    }

    try {
        const { file, filename, contentType, truncated } = await parseMultipartFormData(req);

        if (!file || file.length === 0) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'ファイルが選択されていないか、空のファイルです。' }
            };
            return;
        }

        if (truncated) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'ファイルサイズが5MBを超えています。' }
            };
            return;
        }

        if (!ALLOWED_MIME_TYPES.includes(contentType)) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: '許可されていないファイル形式です。JPEG, PNG, GIF, WebPのみ対応しています。' }
            };
            return;
        }

        const ext = '.' + filename.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: '許可されていないファイル拡張子です。' }
            };
            return;
        }

        const sanitizedBlobName = `${uuidv4()}${ext}`;
        const blockBlobClient = containerClient.getBlockBlobClient(sanitizedBlobName);

        await blockBlobClient.upload(file, file.length, {
            blobHTTPHeaders: { blobContentType: contentType }
        });

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { imageUrl: blockBlobClient.url }
        };
    } catch (error) {
        context.log.error('Image upload failed:', error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: '画像アップロード中にエラーが発生しました。' }
        };
    }
};
