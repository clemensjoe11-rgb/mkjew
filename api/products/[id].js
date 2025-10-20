export const config = { runtime: "nodejs" };
import { getDb } from "../_db.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const db = await getDb();
  const Products = db.collection("products");
  const id = req.query?.id;

  if (!id || !ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

  if (req.method === "GET") {
    const row = await Products.findOne({ _id: new ObjectId(id) }).catch(() => null);
    if (!row) return res.status(404).json({ error: "not found" });
    const { _id, ...r } = row;
    return res.status(200).json({ id: _id, ...r });
  }

  if (req.method === "PUT") {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const { name, description, price_cents, image_url, category } = body;
      const r = await Products.updateOne(
        { _id: new ObjectId(id) },
        { $set: { name, description: description || "", price_cents, image_url: image_url || "", category: category || "", updated_at: Math.floor(Date.now() / 1000) } }
      );
      if (!r.matchedCount) return res.status(404).json({ error: "not found" });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(400).json({ error: "bad request", detail: String(e) });
    }
  }

  if (req.method === "DELETE") {
    const r = await Products.deleteOne({ _id: new ObjectId(id) });
    if (!r.deletedCount) return res.status(404).json({ error: "not found" });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).end();
}