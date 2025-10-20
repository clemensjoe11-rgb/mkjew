// api/products/[id].js
exports.config = { runtime: "nodejs" };
const { getDb } = require("../_db.js");
const { ObjectId } = require("mongodb");

module.exports = async function handler(req, res) {
  const db = await getDb();
  const Products = db.collection("products");
  const id = (req.query && req.query.id) || null;

  if (!id || !ObjectId.isValid(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }

  if (req.method === "GET") {
    const row = await Products.findOne({ _id: new ObjectId(id) }).catch(() => null);
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const { _id, ...r } = row;
    res.status(200).json({ id: _id, ...r });
    return;
  }

  if (req.method === "PUT") {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const { name, description, price_cents, image_url, category } = body;
      const r = await Products.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            description: description || "",
            price_cents,
            image_url: image_url || "",
            category: category || "",
            updated_at: Math.floor(Date.now() / 1000),
          },
        }
      );
      if (!r.matchedCount) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: "bad request", detail: String(e) });
    }
    return;
  }

  if (req.method === "DELETE") {
    const r = await Products.deleteOne({ _id: new ObjectId(id) });
    if (!r.deletedCount) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).end();
};
