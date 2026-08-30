require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI required');
  const client = new MongoClient(process.env.MONGO_URI); await client.connect(); const db = client.db(process.env.MONGO_DB_NAME || 'jewellery-db');
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'Frontend', 'src', 'assets', 'products.json'), 'utf8'));
  const products = source.map((p, i) => ({ title: p.title, slug: `${String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${p.id || i + 1}`, description: p.description || `Beautiful ${p.title}.`, category: p.category || 'Jewellery', material: p.material || 'Premium finish', gemstone: p.gemstone || '', price: Number(p.price) || 0, stock: Number(p.stock || 20), imglink: p.imglink, images: [p.imglink].filter(Boolean), tags: [], featured: i < 4, rating: 0, reviewCount: 0, createdAt: new Date(), updatedAt: new Date() }));
  for (const p of products) await db.collection('products').updateOne({ slug: p.slug }, { $setOnInsert: p }, { upsert: true });
  console.log(`Seeded ${products.length} products`); await client.close();
})().catch(e => { console.error(e); process.exit(1); });
