// api/products/index.js
exports.config = { runtime: "nodejs" };
const { getDb } = require("../_db.js");

module.exports = async function handler(req, res) {
  const db = await getDb();
  const Products = db.collection("products");

  if (req.method === "GET") {
    const { q, category } = req.query || {};
    let filter = {};
    if (q && category) {
      filter = { $and: [{ category }, { $text: { $search: q } }] };
    } else if (q) {
      filter = { $text: { $search: q } };
    } else if (category) {
      filter = { category };
    }

    const rows = await Products.find(filter).sort({ created_at: -1 }).toArray();
    const mapped = rows.map(({ _id, ...r }) => ({ id: _id, ...r }));
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).end(JSON.stringify(mapped));
    return;
  }

  if (req.method === "POST") {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
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
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).end(JSON.stringify({ id: r.insertedId, ...doc }));
    } catch (e) {
      res.status(400).end(JSON.stringify({ error: "bad request", detail: String(e) }));
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
};
