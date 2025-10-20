export const config = { runtime: "nodejs" };
import { getDb } from "../_db.js";

export default async function handler(req, res) {
  const db = await getDb();
  const Products = db.collection("products");

  if (req.method === "GET") {
    const { q, category } = req.query || {};
    let filter = {};
    if (q && category) filter = { $and: [{ category }, { $text: { $search: q } }] };
    else if (q) filter = { $text: { $search: q } };
    else if (category) filter = { category };

    const rows = await Products.find(filter).sort({ created_at: -1 }).toArray();
    res.status(200).json(rows.map(({ _id, ...r }) => ({ id: _id, ...r })));
    return;
  }

  if (req.method === "POST") {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const { sku, name, description, price_cents, image_url, category } = body;
      const ts = Math.floor(Date.now() / 1000);
      const doc = {
        sku,
        name,
        description: description || "",
        price_cents,
        image_url: image_url || "",
        category: category || "",
        created_at: ts,
        updated_at: ts,
      };
      const r = await Products.insertOne(doc);
      res.status(200).json({ id: r.insertedId, ...doc });
      return;
    } catch (e) {
      res.status(400).json({ error: "bad request", detail: String(e) });
      return;
    }
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}