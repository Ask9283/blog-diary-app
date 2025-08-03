// api/get-notes/index.js
const { container } = require("../shared/cosmosClient");

module.exports = async function (context, req) {
    try {
        const page = parseInt(req.query.page || "1", 10);
        const pageSize = parseInt(req.query.pageSize || "6", 10);
        const searchTerm = (req.query.search || "").toLowerCase();

        let querySpec = {
            query: "SELECT * FROM c ORDER BY c._ts DESC",
            parameters: []
        };
        
        // 検索機能の実装（将来的にはより高度な検索が可能）
        // 現時点では、一度全件取得してからフィルタリングします
        const { resources: allItems } = await container.items.query(querySpec).fetchAll();

        let filteredItems = allItems;
        if (searchTerm) {
            filteredItems = allItems.filter(note =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm) ||
                note.tags.toLowerCase().includes(searchTerm)
            );
        }

        const totalItems = filteredItems.length;
        const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

        const response = {
            notes: paginatedItems,
            totalItems: totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page
        };

        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
        };

    } catch (error) {
        context.res = {
            status: 500,
            body: `Error fetching notes: ${error.message}`
        };
    }
};
