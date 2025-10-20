
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(16).slice(2) + '.' + ext);
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// Simple in-memory products
let products = [];

// API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no-file' });
  res.json({ path: '/uploads/' + req.file.filename });
});
app.get('/api/products', (req, res) => res.json(products));
app.post('/api/products', (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.price) return res.status(400).json({ error: 'invalid' });
  b.id = b.id || ('p_' + Date.now());
  products = [b, ...products];
  res.json(b);
});

// Serve built frontend
const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('listening on ' + port));
