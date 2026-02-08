const { container } = require('../shared/cosmosClient');
const { verifyToken, unauthorizedResponse } = require('../shared/authMiddleware');
const { BlobServiceClient } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const BLOB_CONTAINER_NAME = 'images';

module.exports = async function (context, req) {
    const auth = verifyToken(req);
    if (!auth.user) {
        context.log.error('Auth failed:', auth.error);
        context.res = unauthorizedResponse(auth.error);
        return;
    }

    const noteId = req.query.id;
    if (!noteId) {
        context.res = {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'ノートIDが必要です。' }
        };
        return;
    }

    try {
        // 削除前にノート内容を読み取り、画像URLを取得
        const { resource: note } = await container.item(noteId, noteId).read();
        if (!note) {
            context.res = {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
                body: { error: '指定された日記が見つかりません。' }
            };
            return;
        }

        // 画像クリーンアップ: 本文中の画像をBlob Storageから削除
        if (note.content && AZURE_STORAGE_CONNECTION_STRING) {
            const imageUrls = extractImageUrls(note.content);
            if (imageUrls.length > 0) {
                const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
                const blobContainerClient = blobServiceClient.getContainerClient(BLOB_CONTAINER_NAME);

                for (const url of imageUrls) {
                    try {
                        const blobName = extractBlobName(url);
                        if (blobName) {
                            await blobContainerClient.getBlockBlobClient(blobName).deleteIfExists();
                            context.log(`Deleted blob: ${blobName}`);
                        }
                    } catch (blobError) {
                        context.log.warn(`Failed to delete blob for URL ${url}:`, blobError.message);
                    }
                }
            }
        }

        // Cosmos DBからノートを削除
        await container.item(noteId, noteId).delete();

        context.res = { status: 204 };
    } catch (error) {
        context.log.error(`Error deleting note ${noteId}:`, error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: '日記の削除中にエラーが発生しました。' }
        };
    }
};

function extractImageUrls(content) {
    const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    const urls = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        urls.push(match[1]);
    }
    return urls;
}

function extractBlobName(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'images') {
            return pathParts.slice(2).join('/');
        }
        return null;
    } catch {
        return null;
    }
}
