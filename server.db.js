
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(cookieParser());

// DB init
const db = new Database(path.join(__dirname, 'db', 'data.sqlite'));
db.pragma('journal_mode = WAL');

function runMigrations(){
  const fs = (await import('fs')).default;
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  db.exec(schema);
}
function seed(){
  const fs = (await import('fs')).default;
  const seedSql = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8');
  db.exec(seedSql);
}

await runMigrations();
await seed();

// Helpers
const now = () => Math.floor(Date.now()/1000);
const newId = (p) => p + '_' + crypto.randomBytes(8).toString('hex');
const hash = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

function getOrCreateCart({ userId, sessionId }){
  let cart;
  if (userId){
    cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
    if (!cart){
      const id = newId('c');
      db.prepare('INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?,?,?,?)')
        .run(id, userId, now(), now());
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(id);
    }
  } else {
    cart = db.prepare('SELECT * FROM carts WHERE session_id = ?').get(sessionId);
    if (!cart){
      const id = newId('c');
      db.prepare('INSERT INTO carts (id, session_id, created_at, updated_at) VALUES (?,?,?,?)')
        .run(id, sessionId, now(), now());
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(id);
    }
  }
  return cart;
}

// Auth
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try{
    const id = newId('u');
    db.prepare('INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?,?,?,?,?)')
      .run(id, email.toLowerCase(), hash(password), 'user', now());
    return res.json({ id, email, role: 'user' });
  }catch(e){
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'email exists' });
    return res.status(500).json({ error: 'server error' });
  }
});
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get((email||'').toLowerCase());
  if (!u || u.password_hash !== hash(password)) return res.status(401).json({ error: 'invalid credentials' });
  const sid = newId('s');
  res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax', maxAge: 1000*60*60*24*30 });
  return res.json({ id: u.id, email: u.email, role: u.role });
});
app.post('/api/logout', (req, res) => {
  res.clearCookie('sid');
  res.json({ ok: true });
});

// Products
app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(rows);
});
app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});
app.post('/api/products', (req, res) => {
  const { sku, name, description, price_cents, image_url } = req.body;
  const id = newId('p');
  try{
    db.prepare('INSERT INTO products (id, sku, name, description, price_cents, image_url, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, sku, name, description||'', price_cents, image_url||'', now(), now());
    res.json({ id, sku, name, description, price_cents, image_url });
  }catch(e){
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'duplicate sku' });
    res.status(500).json({ error: 'server error' });
  }
});
app.put('/api/products/:id', (req, res) => {
  const { name, description, price_cents, image_url } = req.body;
  const info = db.prepare('UPDATE products SET name=?, description=?, price_cents=?, image_url=?, updated_at=? WHERE id = ?')
    .run(name, description||'', price_cents, image_url||'', now(), req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});
app.delete('/api/products/:id', (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// Cart
function resolveSessionId(req){
  // Fallback to cookie or header
  const fromCookie = req.cookies?.sid;
  const fromHeader = req.header('X-Session-Id');
  return fromCookie || fromHeader || newId('anon');
}

app.get('/api/cart', (req, res) => {
  const sessionId = resolveSessionId(req);
  const cart = getOrCreateCart({ sessionId });
  const items = db.prepare(`SELECT ci.id, ci.qty, p.*
                            FROM cart_items ci JOIN products p ON p.id = ci.product_id
                            WHERE ci.cart_id = ?`).all(cart.id);
  res.json({ cartId: cart.id, sessionId, items });
});

app.post('/api/cart/items', (req, res) => {
  const { product_id, qty } = req.body;
  if (!product_id || !qty) return res.status(400).json({ error: 'product_id and qty required' });
  const sessionId = resolveSessionId(req);
  const cart = getOrCreateCart({ sessionId });
  // upsert
  const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id, product_id);
  if (existing){
    db.prepare('UPDATE cart_items SET qty=?, updated_at=? WHERE id=?').run(qty, now(), existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (id, cart_id, product_id, qty, created_at, updated_at) VALUES (?,?,?,?,?,?)')
      .run(newId('ci'), cart.id, product_id, qty, now(), now());
  }
  const items = db.prepare('SELECT * FROM cart_items WHERE cart_id=?').all(cart.id);
  res.json({ cartId: cart.id, items });
});

app.delete('/api/cart/items/:id', (req, res) => {
  const info = db.prepare('DELETE FROM cart_items WHERE id=?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// Static
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('DB API running on ' + PORT));
