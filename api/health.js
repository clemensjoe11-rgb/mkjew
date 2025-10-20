// api/health.js
exports.config = { runtime: "nodejs" };
const { getDb } = require("./_db.js");

module.exports = async function handler(_req, res) {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};