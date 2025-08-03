// api/update-note/index.js
const { container } = require("../shared/cosmosClient");

module.exports = async function (context, req) {
    try {
        const updatedNote = req.body;
        const noteId = updatedNote.id;

        if (!noteId) {
            return context.res = { status: 400, body: "Note ID is required" };
        }

        const { resource: replacedItem } = await container.item(noteId, noteId).replace(updatedNote);

        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: replacedItem
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error updating note: ${error.message}`
        };
    }
};
