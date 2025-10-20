// api/_db.js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "mkjewelery";

if (!uri) {
  throw new Error("Missing MONGODB_URI");
}

let cachedDb = null;
let cachedClient = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  cachedDb = client.db(dbName);
  return cachedDb;
}

module.exports = { getDb };
