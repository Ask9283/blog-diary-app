// api/get-notes/index.js
const { container } = require("../shared/cosmosClient");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notesData)
    };
}

