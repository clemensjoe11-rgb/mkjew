export const config = { runtime: "nodejs" };
import crypto from "crypto";
import { getDb } from "./_db.js";

const hash = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
const now = () => Math.floor(Date.now() / 1000);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const { email, password } = body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const db = await getDb();
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").insertOne({
      email: String(email).toLowerCase(),
      password_hash: hash(password),
      role: "user",
      created_at: now(),
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("E11000")) return res.status(409).json({ error: "email exists" });
    res.status(500).json({ error: "server error" });
  }
}