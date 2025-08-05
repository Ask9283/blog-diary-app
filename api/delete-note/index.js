// api/delete-note/index.js
const { container } = require("../shared/cosmosClient");

module.exports = async function (context, req) {
    const noteId = req.query.id;
    context.log(`Attempting to delete note with ID: ${noteId}`);

    if (!noteId) {
        context.log("Error: Note ID was not provided.");
        return context.res = { status: 400, body: "Note ID is required" };
    }

    try {
        // Cosmos DBのdelete操作には、アイテムIDとパーティションキーの両方が必要です。
        // 私たちの設計では、どちらも同じnoteIdになります。
        await container.item(noteId, noteId).delete();

        context.res = {
            status: 204 // Success, No Content
        };
    } catch (error) {
        context.log.error(`Error deleting note ${noteId}:`, error);
        
        // フロントエンドに、より詳細なエラー情報を返すように変更
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { message: `データベース操作中にエラーが発生しました: ${error.code}` }
        };
    }
};
