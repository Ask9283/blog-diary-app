// api/shared/cosmosClient.js
const { CosmosClient } = require("@azure/cosmos");

// データベースの接続情報を環境変数から取得
const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
if (!connectionString) {
    throw new Error("Azure Cosmos DB Connection String is not defined");
}

const client = new CosmosClient(connectionString);
const database = client.database("DiaryDB");
const container = database.container("Notes");

module.exports = { container };
