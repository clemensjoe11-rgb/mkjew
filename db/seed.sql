INSERT OR IGNORE INTO products (id, sku, name, description, price_cents, image_url, created_at, updated_at) VALUES
('p_1','RING-001','Gold Ring','18k gold ring', 12999, '/images/ring1.jpg', strftime('%s','now'), strftime('%s','now')),
('p_2','NECK-002','Silver Necklace','Sterling silver', 8999, '/images/necklace1.jpg', strftime('%s','now'), strftime('%s','now')),
('p_3','EAR-003','Diamond Earrings','Lab-grown', 159999, '/images/earrings1.jpg', strftime('%s','now'), strftime('%s','now'));
