// server.mongo.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// ---- MongoDB ----
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'mkjewelery';
if (!MONGODB_URI) { console.error('Missing MONGODB_URI'); process.exit(1); }
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(DB_NAME);
const Users = db.collection('users');
const Products = db.collection('products');
const Categories = db.collection('categories');
const Carts = db.collection('carts');
const CartItems = db.collection('cart_items');

await Users.createIndex({ email: 1 }, { unique: true });
await Products.createIndex({ sku: 1 }, { unique: true });
await Products.createIndex({ name: 'text', description: 'text', category: 'text' });
await Products.createIndex({ category: 1 });
await Categories.createIndex({ slug: 1 }, { unique: true });
await Carts.createIndex({ userId: 1 }, { unique: true, sparse: true });
await Carts.createIndex({ sessionId: 1 }, { unique: true, sparse: true });
await CartItems.createIndex({ cartId: 1, productId: 1 }, { unique: true });

const now = () => Math.floor(Date.now() / 1000);
const newId = (p) => p + '_' + crypto.randomBytes(8).toString('hex');
const hash = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const toSlug = (s) => String(s||'').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'');

// ---- Seed ----
async function seedIfEmpty(){
  if (await Categories.estimatedDocumentCount() === 0){
    await Categories.insertMany([
      { _id:'cat_ring', name:'ring', slug:'ring', created_at: now() },
      { _id:'cat_necklace', name:'necklace', slug:'necklace', created_at: now() },
      { _id:'cat_earrings', name:'earrings', slug:'earrings', created_at: now() },
    ]);
  }
  if (await Products.estimatedDocumentCount() === 0){
    const ts = now();
    await Products.insertMany([
      { _id:'p_1', sku:'RING-001', category:'ring', name:'Gold Ring', description:'18k gold ring', price_cents:12999, image_url:'/images/ring1.jpg', created_at:ts, updated_at:ts },
      { _id:'p_2', sku:'NECK-002', category:'necklace', name:'Silver Necklace', description:'Sterling silver', price_cents:8999, image_url:'/images/necklace1.jpg', created_at:ts, updated_at:ts },
      { _id:'p_3', sku:'EAR-003', category:'earrings', name:'Diamond Earrings', description:'Lab-grown', price_cents:159999, image_url:'/images/earrings1.jpg', created_at:ts, updated_at:ts },
    ]);
  }
}
await seedIfEmpty();

// ---- Helpers ----
function readAuth(req){
  try{
    const raw = req.cookies?.auth;
    if (!raw) return null;
    const p = JSON.parse(Buffer.from(String(raw), 'base64').toString('utf8'));
    return p?.id && p?.email ? p : null;
  }catch{ return null; }
}
function setAuthCookie(res, user){
  const payload = Buffer.from(JSON.stringify({ id:user._id, email:user.email, role:user.role })).toString('base64');
  res.cookie('auth', payload, { httpOnly:true, sameSite:'lax', maxAge: 1000*60*60*24*30 });
}
function resolveSessionId(req){
  const fromCookie = req.cookies?.sid;
  const fromHeader = req.header('X-Session-Id');
  return fromCookie || fromHeader || newId('anon');
}
async function getOrCreateCartIdentity(req){
  const auth = readAuth(req);
  if (auth?.id) return { userId: auth.id };
  return { sessionId: resolveSessionId(req) };
}
async function getOrCreateCart({ userId, sessionId }){
  let cart;
  if (userId){
    cart = await Carts.findOne({ userId });
    if (!cart){ cart = { _id: newId('c'), userId, created_at: now(), updated_at: now() }; await Carts.insertOne(cart); }
  } else {
    cart = await Carts.findOne({ sessionId });
    if (!cart){ cart = { _id: newId('c'), sessionId, created_at: now(), updated_at: now() }; await Carts.insertOne(cart); }
  }
  return cart;
}
async function mergeCarts(srcCart, dstCart){
  const items = await CartItems.find({ cartId: srcCart._id }).toArray();
  for (const it of items){
    const ex = await CartItems.findOne({ cartId: dstCart._id, productId: it.productId });
    if (ex){
      await CartItems.updateOne({ _id: ex._id }, { $set: { qty: ex.qty + it.qty, updated_at: now() } });
    } else {
      await CartItems.insertOne({ _id:newId('ci'), cartId: dstCart._id, productId: it.productId, qty: it.qty, created_at: now(), updated_at: now() });
    }
  }
  await CartItems.deleteMany({ cartId: srcCart._id });
  await Carts.deleteOne({ _id: srcCart._id });
}

// ---- Auth ----
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const doc = { _id: newId('u'), email: String(email).toLowerCase(), password_hash: hash(password), role: 'user', created_at: now() };
    await Users.insertOne(doc);
    setAuthCookie(res, doc);
    res.cookie('sid', newId('s'), { httpOnly:true, sameSite:'lax', maxAge: 1000*60*60*24*30 });
    res.json({ id: doc._id, email: doc.email, role: doc.role });
  } catch (e) {
    if (String(e).includes('E11000')) return res.status(409).json({ error: 'email exists' });
    res.status(500).json({ error: 'server error' });
  }
});
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = await Users.findOne({ email: String(email||'').toLowerCase() });
  if (!u || u.password_hash !== hash(password)) return res.status(401).json({ error: 'invalid credentials' });

  // merge: Gast-Cart (alte sid) -> User-Cart
  const oldSid = req.cookies?.sid;
  let guestCart = null;
  if (oldSid) guestCart = await Carts.findOne({ sessionId: oldSid });

  const userCart = await getOrCreateCart({ userId: u._id });
  if (guestCart) await mergeCarts(guestCart, userCart);

  // neue Session-Cookie und Auth-Cookie setzen
  res.cookie('sid', newId('s'), { httpOnly:true, sameSite:'lax', maxAge: 1000*60*60*24*30 });
  setAuthCookie(res, u);

  res.json({ id: u._id, email: u.email, role: u.role });
});
app.post('/api/logout', async (req, res) => {
  // User-Cart bleibt bestehen
  const sid = req.cookies?.sid;
  if (sid){
    const cart = await Carts.findOne({ sessionId: sid });
    if (cart){ await CartItems.deleteMany({ cartId: cart._id }); await Carts.deleteOne({ _id: cart._id }); }
  }
  res.clearCookie('sid');
  res.clearCookie('auth');
  res.json({ ok: true });
});
app.get('/api/me', async (req, res) => {
  try{
    const parsed = readAuth(req);
    if (!parsed) return res.json(null);
    const u = await Users.findOne({ _id: parsed.id, email: parsed.email });
    if (!u) return res.json(null);
    res.json({ id: u._id, email: u.email, role: u.role });
  }catch{ res.json(null); }
});

// ---- Admin: Users ----
app.get('/api/admin/users', async (_req, res) => {
  const users = await Users.find({}, { projection: { password_hash: 0 } }).sort({ created_at: -1 }).toArray();
  res.json(users.map(u => ({ id: u._id, email: u.email, role: u.role, created_at: u.created_at })));
});
app.put('/api/admin/users/:id/role', async (req, res) => {
  const { role } = req.body || {};
  const r = await Users.updateOne({ _id: req.params.id }, { $set: { role } });
  if (!r.matchedCount) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});
app.post('/api/admin/users/:id/reset-password', async (req, res) => {
  const { new_password } = req.body || {};
  if (!new_password) return res.status(400).json({ error: 'new_password required' });
  const r = await Users.updateOne({ _id: req.params.id }, { $set: { password_hash: hash(new_password) } });
  if (!r.matchedCount) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});
app.delete('/api/admin/users/:id', async (req, res) => {
  const r = await Users.deleteOne({ _id: req.params.id });
  if (!r.deletedCount) return res.status(404).json({ error: 'not found' });
  const cart = await Carts.findOne({ userId: req.params.id });
  if (cart){ await CartItems.deleteMany({ cartId: cart._id }); await Carts.deleteOne({ _id: cart._id }); }
  res.json({ ok: true });
});

// ---- Categories ----
app.get('/api/categories', async (_req, res) => {
  const rows = await Categories.find().sort({ name: 1 }).toArray();
  res.json(rows.map(({ _id, name, slug }) => ({ id:_id, name, slug })));
});
app.post('/api/admin/categories', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error:'name required' });
  const slug = toSlug(name);
  try{
    const doc = { _id: newId('cat'), name: name.trim(), slug, created_at: now() };
    await Categories.insertOne(doc);
    res.json({ id: doc._id, name: doc.name, slug: doc.slug });
  }catch(e){
    if (String(e).includes('E11000')) return res.status(409).json({ error:'category exists' });
    res.status(500).json({ error:'server error' });
  }
});
app.delete('/api/admin/categories/:id', async (req, res) => {
  await Categories.deleteOne({ _id: req.params.id });
  res.json({ ok:true });
});

// ---- Products (Filter + Suche wie gefordert) ----
// Logik:
// - keine category & q leer    -> alle
// - nur category               -> nur category
// - nur q                      -> nur Namens-Treffer
// - category + q               -> category ODER Namens-Treffer
app.get('/api/products', async (req, res) => {
  const { q, category } = req.query || {};
  const hasQ = !!String(q||'').trim();
  const hasCat = !!String(category||'').trim();

  let filter = {};
  if (!hasCat && !hasQ) {
    filter = {};
  } else if (hasCat && !hasQ) {
    filter = { category: String(category).trim() };
  } else if (!hasCat && hasQ) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'i');
    filter = { name: rx };
  } else {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'i');
    filter = { $or: [ { category: String(category).trim() }, { name: rx } ] };
  }

  const rows = await Products.find(filter).sort({ created_at: -1 }).toArray();
  res.json(rows.map(({ _id, ...rest }) => ({ id: _id, ...rest })));
});
app.get('/api/products/:id', async (req, res) => {
  const row = await Products.findOne({ _id: req.params.id });
  if (!row) return res.status(404).json({ error: 'not found' });
  const { _id, ...rest } = row; res.json({ id: _id, ...rest });
});
app.post('/api/products', async (req, res) => {
  const { sku, name, description, price_cents, image_url, category } = req.body || {};
  const doc = { _id: newId('p'), sku, name, category: category||'', description: description||'', price_cents, image_url: image_url||'', created_at: now(), updated_at: now() };
  try { await Products.insertOne(doc); const { _id, ...rest } = doc; res.json({ id: _id, ...rest }); }
  catch(e){ if (String(e).includes('E11000')) return res.status(409).json({ error: 'duplicate sku' }); res.status(500).json({ error: 'server error' }); }
});
app.put('/api/products/:id', async (req, res) => {
  const { name, description, price_cents, image_url, category } = req.body || {};
  const r = await Products.updateOne(
    { _id: req.params.id },
    { $set: { name, description: description||'', price_cents, image_url: image_url||'', category: category||'', updated_at: now() } }
  );
  if (r.matchedCount === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});
app.delete('/api/products/:id', async (req, res) => {
  const r = await Products.deleteOne({ _id: req.params.id });
  if (r.deletedCount === 0) return res.status(404).json({ error: 'not found' });
  await CartItems.deleteMany({ productId: req.params.id });
  res.json({ ok: true });
});

// ---- Cart (nutzt userId wenn eingeloggt, sonst sid) ----
app.get('/api/cart', async (req, res) => {
  const id = await getOrCreateCartIdentity(req);
  const cart = await getOrCreateCart(id);
  const items = await CartItems.aggregate([
    { $match: { cartId: cart._id } },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' }
  ]).toArray();
  const normalized = items.map(ci => ({
    id: ci._id,
    qty: ci.qty,
    product: { id: ci.product._id, ...Object.fromEntries(Object.entries(ci.product).filter(([k]) => k !== '_id')) }
  }));
  res.json({ cartId: cart._id, items: normalized });
});
app.post('/api/cart/items', async (req, res) => {
  const { product_id, qty } = req.body || {};
  if (!product_id && product_id !== 0) return res.status(400).json({ error: 'product_id required' });
  const qn = Number(qty);
  const id = await getOrCreateCartIdentity(req);
  const cart = await getOrCreateCart(id);
  if (!qn || qn <= 0){
    await CartItems.deleteOne({ cartId: cart._id, productId: product_id });
    const items = await CartItems.find({ cartId: cart._id }).toArray();
    return res.json({ cartId: cart._id, items });
  }
  const existing = await CartItems.findOne({ cartId: cart._id, productId: product_id });
  if (existing){
    await CartItems.updateOne({ _id: existing._id }, { $set: { qty: qn, updated_at: now() } });
  } else {
    await CartItems.insertOne({ _id: newId('ci'), cartId: cart._id, productId: product_id, qty: qn, created_at: now(), updated_at: now() });
  }
  const items = await CartItems.find({ cartId: cart._id }).toArray();
  res.json({ cartId: cart._id, items });
});
app.delete('/api/cart/items/:id', async (req, res) => {
  const id = await getOrCreateCartIdentity(req);
  const cart = await getOrCreateCart(id);
  const r = await CartItems.deleteOne({ _id: req.params.id, cartId: cart._id });
  if (r.deletedCount === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// ---- Static ----
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Mongo API running on ' + PORT));
