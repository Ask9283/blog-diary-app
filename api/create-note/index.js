// api/create-note/index.js
const { container } = require("../shared/cosmosClient");

module.exports = async function (context, req) {
    try {
        const newNote = req.body;
        // Cosmos DBはidが必須。簡易的にタイムスタンプを文字列として利用
        newNote.id = Date.now().toString(); 

        const { resource: createdItem } = await container.items.create(newNote);

        context.res = {
            status: 201, // Created
            headers: { 'Content-Type': 'application/json' },
            body: createdItem
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error creating note: ${error.message}`
        };
    }
};
