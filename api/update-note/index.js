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
        const updatedNote = req.body;
        const noteId = updatedNote && updatedNote.id;

        if (!noteId) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'ノートIDが必要です。' }
            };
            return;
        }

        const validation = validateNote(updatedNote);
        if (!validation.valid) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { error: validation.message }
            };
            return;
        }

        const { resource: existingNote } = await container.item(noteId, noteId).read();
        if (!existingNote) {
            context.res = {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
                body: { error: '指定された日記が見つかりません。' }
            };
            return;
        }

        const sanitizedNote = {
            id: noteId,
            title: updatedNote.title.trim(),
            content: updatedNote.content,
            tags: (updatedNote.tags || '').trim()
        };

        const { resource: replacedItem } = await container.item(noteId, noteId).replace(sanitizedNote);

        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: replacedItem
        };
    } catch (error) {
        context.log.error('Error updating note:', error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: '日記の更新中にエラーが発生しました。' }
        };
    }
};
