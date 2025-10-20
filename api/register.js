// api/register.js
exports.config = { runtime: "nodejs" };
const crypto = require("crypto");
const { getDb } = require("./_db.js");

const hash = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
const now = () => Math.floor(Date.now() / 1000);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const { email, password } = body || {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
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
    if (msg.includes("E11000")) {
      res.status(409).json({ error: "email exists" });
      return;
    }
    res.status(500).json({ error: "server error" });
  }
};