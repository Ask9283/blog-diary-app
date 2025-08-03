// api/delete-note/index.js
const { container } = require("../shared/cosmosClient");

module.exports = async function (context, req) {
    try {
        const noteId = req.query.id;

        if (!noteId) {
            return context.res = { status: 400, body: "Note ID is required" };
        }

        await container.item(noteId, noteId).delete();

        context.res = {
            status: 204 // No Content
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error deleting note: ${error.message}`
        };
    }
};
