const { container } = require('../shared/cosmosClient');
const { verifyToken, unauthorizedResponse } = require('../shared/authMiddleware');
const { validateNote } = require('../shared/validate');

module.exports = async function (context, req) {
    const user = verifyToken(req);
    if (!user) {
        context.res = unauthorizedResponse();
        return;
    }

    try {
        const newNote = req.body;

        const validation = validateNote(newNote);
        if (!validation.valid) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: validation.message }
            };
            return;
        }

        const sanitizedNote = {
            id: Date.now().toString(),
            title: newNote.title.trim(),
            content: newNote.content,
            tags: (newNote.tags || '').trim()
        };

        const { resource: createdItem } = await container.items.create(sanitizedNote);

        context.res = {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
            body: createdItem
        };
    } catch (error) {
        context.log.error('Error creating note:', error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: '日記の作成中にエラーが発生しました。' }
        };
    }
};
