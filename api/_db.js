import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "mkjewelery";
if (!uri) throw new Error("Missing MONGODB_URI");

let cachedDb;

/** Return a connected DB instance with simple caching for serverless. */
export async function getDb() {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, appName: "vercel" });
  await client.connect();
  cachedDb = client.db(dbName);
  return cachedDb;
}