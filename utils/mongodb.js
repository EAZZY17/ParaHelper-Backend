const { MongoClient } = require("mongodb");

let client;

async function connectMongo() {
  if (client) {
    return client;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment");
  }

  client = new MongoClient(uri);
  await client.connect();
  console.log("[mongodb] Connected");
  return client;
}

function getDb(dbName) {
  if (!client) {
    throw new Error("Mongo client not connected");
  }
  return client.db(dbName);
}

module.exports = { connectMongo, getDb };
