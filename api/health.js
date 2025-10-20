export const config = { runtime: "nodejs" };
import { getDb } from "./_db.js";

export default async function handler(_req, res) {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}