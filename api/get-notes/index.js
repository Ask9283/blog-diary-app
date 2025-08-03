// api/get-notes/index.js
const { container } = require("../shared/cosmosClient");

module.exports = async function (context, req) {
    try {
        const { resources: items } = await container.items
            .query("SELECT * from c ORDER BY c._ts DESC") // 作成日時の降順で取得
            .fetchAll();

        context.res = {
            headers: { 'Content-Type': 'application/json' },
            // ★★★ ここを更新しました ★★★
            // 取得したデータをJSON文字列に変換して返す
            body: JSON.stringify(items)
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error fetching notes: ${error.message}`
        };
    }
};
