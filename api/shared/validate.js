function validateNote(note) {
    if (!note) {
        return { valid: false, message: 'リクエストボディが必要です。' };
    }
    if (!note.title || typeof note.title !== 'string' || note.title.trim().length === 0) {
        return { valid: false, message: 'タイトルは必須です。' };
    }
    if (note.title.length > 200) {
        return { valid: false, message: 'タイトルは200文字以内で入力してください。' };
    }
    if (!note.content || typeof note.content !== 'string') {
        return { valid: false, message: '本文は必須です。' };
    }
    if (note.content.length > 50000) {
        return { valid: false, message: '本文は50000文字以内で入力してください。' };
    }
    if (note.tags && typeof note.tags === 'string' && note.tags.length > 0) {
        const tags = note.tags.split(' ').filter(t => t.length > 0);
        if (tags.length > 20) {
            return { valid: false, message: 'タグは20個以内で入力してください。' };
        }
        for (const tag of tags) {
            if (tag.length > 50) {
                return { valid: false, message: '各タグは50文字以内で入力してください。' };
            }
        }
    }
    return { valid: true };
}

module.exports = { validateNote };
