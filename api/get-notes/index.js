const { container } = require('../shared/cosmosClient');
const { createRateLimiter } = require('../shared/rateLimiter');

// レート制限: 同一IPから1分間に60リクエストまで
const isGetNotesRateLimited = createRateLimiter('get-notes', 60, 60 * 1000);

module.exports = async function (context, req) {
    const clientIp = (req.headers['x-forwarded-for'] || req.headers['client-ip'] || 'unknown').split(',')[0].trim();
    if (isGetNotesRateLimited(clientIp)) {
        context.res = {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'リクエスト数が制限を超えました。しばらくお待ちください。' }
        };
        return;
    }

    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '6', 10) || 6));
        const searchTerm = (req.query.search || '').toLowerCase().substring(0, 200);

        const querySpec = {
            query: 'SELECT * FROM c ORDER BY c._ts DESC',
            parameters: []
        };

        const { resources: allItems } = await container.items.query(querySpec).fetchAll();

        let filteredItems = allItems;
        if (searchTerm) {
            filteredItems = allItems.filter(note =>
                (note.title || '').toLowerCase().includes(searchTerm) ||
                (note.content || '').toLowerCase().includes(searchTerm) ||
                (note.tags || '').toLowerCase().includes(searchTerm)
            );
        }

        const totalItems = filteredItems.length;
        const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notes: paginatedItems,
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
                currentPage: page
            })
        };
    } catch (error) {
        context.log.error('Error fetching notes:', error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: '日記の読み込み中にエラーが発生しました。' }
        };
    }
};
