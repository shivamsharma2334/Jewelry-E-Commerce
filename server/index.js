require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || '';

if (!MONGO_URI || !JWT_SECRET || !REFRESH_SECRET) {
  console.warn('Missing required env: MONGO_URI, JWT_SECRET, REFRESH_SECRET');
}
if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32 || !REFRESH_SECRET || REFRESH_SECRET.length < 32)) {
  throw new Error('Production JWT secrets must be at least 32 characters.');
}

const allowedOrigins = FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed'));
  }, credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-8', legacyHeaders: false });
app.use('/api', apiLimiter);

let cachedDb;
async function getDb() {
  if (cachedDb) return cachedDb;
  if (!MONGO_URI) throw new Error('MONGO_URI is not configured');
  const client = new MongoClient(MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  await client.connect();
  cachedDb = client.db(process.env.MONGO_DB_NAME || 'jewellery-db');
  await ensureIndexes(cachedDb);
  return cachedDb;
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true }),
    db.collection('products').createIndex({ slug: 1 }, { unique: true }),
    db.collection('products').createIndex({ category: 1, price: 1 }),
    db.collection('products').createIndex({ title: 'text', description: 'text', tags: 'text' }),
    db.collection('orders').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('orders').createIndex({ status: 1, createdAt: -1 }),
    db.collection('reviews').createIndex({ productId: 1, createdAt: -1 }),
    db.collection('wishlists').createIndex({ userId: 1, productId: 1 }, { unique: true }),
    db.collection('refreshTokens').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('refreshTokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('verificationTokens').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('verificationTokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('passwordResets').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('passwordResets').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('contacts').createIndex({ submittedAt: -1 }),
    db.collection('analytics').createIndex({ createdAt: -1 }),
    db.collection('auditLogs').createIndex({ createdAt: -1 }),
    db.collection('carts').createIndex({ userId: 1 }, { unique: true }),
  ]);
}

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function safeObjectId(id) { return ObjectId.isValid(id) ? new ObjectId(id) : null; }
function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return 'Password must be between 12 and 128 characters.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return 'Password must include uppercase, lowercase, number and special character.';
  return null;
}
function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, picture: user.picture || null, role: user.role || 'customer', emailVerified: !!user.emailVerified };
}
function signAccessToken(user) { return jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '15m', issuer: 'jewelry-eshop', audience: 'jewelry-eshop-web' }); }
function signRefreshToken(user, tokenId) { return jwt.sign({ sub: user._id.toString(), jti: tokenId }, REFRESH_SECRET, { expiresIn: '7d', issuer: 'jewelry-eshop', audience: 'jewelry-eshop-web' }); }
function setAuthCookies(res, accessToken, refreshToken) {
  const base = { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' };
  res.cookie('access_token', accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}
function clearAuthCookies(res) {
  const base = { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' };
  res.clearCookie('access_token', base); res.clearCookie('refresh_token', base);
}
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function randomToken() { return crypto.randomBytes(32).toString('hex'); }

async function issueSession(res, user) {
  const tokenId = new ObjectId().toString();
  const refreshToken = signRefreshToken(user, tokenId);
  const db = await getDb();
  await db.collection('refreshTokens').insertOne({ tokenHash: sha256(refreshToken), userId: user._id, tokenId, createdAt: new Date(), expiresAt: new Date(Date.now() + 7 * 86400000) });
  setAuthCookies(res, signAccessToken(user), refreshToken);
}
async function requireAuth(req, res, next) {
  try {
    const payload = jwt.verify(req.cookies.access_token || '', JWT_SECRET, { issuer: 'jewelry-eshop', audience: 'jewelry-eshop-web' });
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: safeObjectId(payload.sub) });
    if (!user) return res.status(401).json({ message: 'Authentication required.' });
    req.user = user; next();
  } catch { return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
}
function requireRole(...roles) { return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ message: 'You do not have permission to perform this action.' }); }

async function audit(db, req, action, target = null, details = {}) {
  await db.collection('auditLogs').insertOne({ action, target, actorId: req.user?._id || null, ip: req.ip, details, createdAt: new Date() });
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn('Email provider not configured; email not sent to', to, subject);
    return false;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider error: ${response.status}`);
  return true;
}

app.get('/', (_req, res) => res.json({ ok: true, service: 'Jewelry E-Commerce API', version: '2.0' }));
app.get('/api/health', async (_req, res) => { try { await getDb(); res.json({ ok: true, database: 'connected' }); } catch { res.status(503).json({ ok: false, database: 'unavailable' }); } });

app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim(); const email = normalizeEmail(req.body.email); const password = req.body.password;
    if (name.length < 2 || name.length > 80 || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid name and email.' });
    const passwordError = validatePassword(password); if (passwordError) return res.status(400).json({ message: passwordError });
    const db = await getDb(); if (await db.collection('users').findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = { name, email, passwordHash: await bcrypt.hash(password, 12), provider: 'local', role: 'customer', emailVerified: false, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('users').insertOne(user); user._id = result.insertedId;
    const token = randomToken(); await db.collection('verificationTokens').insertOne({ userId: user._id, tokenHash: sha256(token), createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000) });
    const link = `${FRONTEND_URL.split(',')[0] || 'http://localhost:5173'}/verify-email?token=${token}`;
    await sendEmail({ to: email, subject: 'Verify your Jewelify account', html: `<p>Welcome ${name}.</p><p>Verify your email: <a href="${link}">${link}</a></p>` });
    await issueSession(res, user); res.status(201).json({ message: 'Account created. Please verify your email.', user: publicUser(user) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Unable to create account.' }); }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email); const password = req.body.password; if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const db = await getDb(); const user = await db.collection('users').findOne({ email }); const valid = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) return res.status(401).json({ message: 'Invalid email or password.' });
    if (user.suspended) return res.status(403).json({ message: 'This account is suspended.' });
    await db.collection('users').updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }); await issueSession(res, user);
    res.json({ message: 'Login successful.', user: publicUser(user) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Unable to sign in.' }); }
});

app.post('/api/auth/google', authLimiter, async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google Sign-In is not configured.' });
    const credential = req.body.credential; if (!credential) return res.status(400).json({ message: 'Google credential is required.' });
    const ticket = await new OAuth2Client(GOOGLE_CLIENT_ID).verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID }); const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) return res.status(401).json({ message: 'Google account could not be verified.' });
    const db = await getDb(); const email = normalizeEmail(payload.email); let user = await db.collection('users').findOne({ $or: [{ googleId: payload.sub }, { email }] });
    if (!user) { user = { name: payload.name || email.split('@')[0], email, googleId: payload.sub, picture: payload.picture || null, provider: 'google', role: 'customer', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }; const r = await db.collection('users').insertOne(user); user._id = r.insertedId; }
    else { await db.collection('users').updateOne({ _id: user._id }, { $set: { googleId: payload.sub, picture: payload.picture || user.picture || null, emailVerified: true, updatedAt: new Date(), lastLoginAt: new Date() } }); user = { ...user, googleId: payload.sub, emailVerified: true }; }
    if (user.suspended) return res.status(403).json({ message: 'This account is suspended.' }); await issueSession(res, user); res.json({ message: 'Google sign-in successful.', user: publicUser(user) });
  } catch (e) { console.error(e); res.status(401).json({ message: 'Google sign-in failed.' }); }
});

app.get('/api/auth/verify-email', async (req, res) => {
  try { const db = await getDb(); const record = await db.collection('verificationTokens').findOne({ tokenHash: sha256(req.query.token || '') }); if (!record) return res.status(400).json({ message: 'Invalid or expired verification link.' }); await db.collection('users').updateOne({ _id: record.userId }, { $set: { emailVerified: true, updatedAt: new Date() } }); await db.collection('verificationTokens').deleteOne({ _id: record._id }); res.json({ message: 'Email verified successfully.' }); }
  catch { res.status(400).json({ message: 'Invalid or expired verification link.' }); }
});
app.post('/api/auth/resend-verification', authLimiter, requireAuth, async (req, res) => {
  try { if (req.user.emailVerified) return res.json({ message: 'Email already verified.' }); const db = await getDb(); const token = randomToken(); await db.collection('verificationTokens').insertOne({ userId: req.user._id, tokenHash: sha256(token), createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000) }); const link = `${FRONTEND_URL.split(',')[0] || 'http://localhost:5173'}/verify-email?token=${token}`; await sendEmail({ to: req.user.email, subject: 'Verify your Jewelify account', html: `<p><a href="${link}">Verify email</a></p>` }); res.json({ message: 'Verification email requested.' }); } catch { res.status(500).json({ message: 'Unable to send verification email.' }); }
});

app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try { const email = normalizeEmail(req.body.email); const db = await getDb(); const user = await db.collection('users').findOne({ email }); if (user) { const token = randomToken(); await db.collection('passwordResets').insertOne({ userId: user._id, tokenHash: sha256(token), createdAt: new Date(), expiresAt: new Date(Date.now() + 3600000) }); const link = `${FRONTEND_URL.split(',')[0] || 'http://localhost:5173'}/reset-password?token=${token}`; await sendEmail({ to: email, subject: 'Reset your Jewelify password', html: `<p>Reset your password: <a href="${link}">${link}</a></p>` }); } res.json({ message: 'If that email exists, a reset link has been sent.' }); } catch { res.json({ message: 'If that email exists, a reset link has been sent.' }); }
});
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try { const error = validatePassword(req.body.password); if (error) return res.status(400).json({ message: error }); const db = await getDb(); const record = await db.collection('passwordResets').findOne({ tokenHash: sha256(req.body.token || '') }); if (!record) return res.status(400).json({ message: 'Invalid or expired reset link.' }); await db.collection('users').updateOne({ _id: record.userId }, { $set: { passwordHash: await bcrypt.hash(req.body.password, 12), updatedAt: new Date() } }); await db.collection('refreshTokens').deleteMany({ userId: record.userId }); await db.collection('passwordResets').deleteOne({ _id: record._id }); clearAuthCookies(res); res.json({ message: 'Password reset successfully.' }); } catch { res.status(400).json({ message: 'Invalid or expired reset link.' }); }
});

app.post('/api/auth/refresh', async (req, res) => {
  try { const token = req.cookies.refresh_token; const payload = jwt.verify(token || '', REFRESH_SECRET, { issuer: 'jewelry-eshop', audience: 'jewelry-eshop-web' }); const db = await getDb(); const stored = await db.collection('refreshTokens').findOne({ tokenHash: sha256(token), tokenId: payload.jti }); if (!stored) throw new Error('invalid'); const user = await db.collection('users').findOne({ _id: safeObjectId(payload.sub) }); if (!user) throw new Error('invalid'); await db.collection('refreshTokens').deleteOne({ _id: stored._id }); await issueSession(res, user); res.json({ user: publicUser(user) }); } catch { clearAuthCookies(res); res.status(401).json({ message: 'Session expired.' }); }
});
app.post('/api/auth/logout', async (req, res) => { try { if (req.cookies.refresh_token) { const db = await getDb(); await db.collection('refreshTokens').deleteOne({ tokenHash: sha256(req.cookies.refresh_token) }); } } finally { clearAuthCookies(res); res.json({ message: 'Logged out.' }); } });
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

function productView(p) { return { ...p, id: p._id?.toString() || p.id }; }
app.get('/api/products', async (req, res) => {
  try { const db = await getDb(); const { q, category, minPrice, maxPrice, sort = 'newest', page = 1, limit = 24 } = req.query; const filter = {};
    if (category) filter.category = category; if (q) filter.$text = { $search: q }; if (minPrice || maxPrice) filter.price = {}; if (minPrice) filter.price.$gte = Number(minPrice); if (maxPrice) filter.price.$lte = Number(maxPrice);
    const sortMap = { priceAsc: { price: 1 }, priceDesc: { price: -1 }, newest: { createdAt: -1 }, rating: { rating: -1 } }; const p = Math.max(1, Number(page)); const l = Math.min(60, Math.max(1, Number(limit))); const total = await db.collection('products').countDocuments(filter); const items = await db.collection('products').find(filter).sort(sortMap[sort] || sortMap.newest).skip((p - 1) * l).limit(l).toArray(); res.json({ items: items.map(productView), total, page: p, pages: Math.ceil(total / l) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Unable to load products.' }); }
});
app.get('/api/products/:id', async (req, res) => { try { const db = await getDb(); const id = safeObjectId(req.params.id); const product = id ? await db.collection('products').findOne({ _id: id }) : await db.collection('products').findOne({ slug: req.params.id }); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.json({ product: productView(product) }); } catch { res.status(404).json({ message: 'Product not found.' }); } });

app.get('/api/categories', async (_req, res) => { try { const db = await getDb(); res.json({ categories: await db.collection('products').distinct('category') }); } catch { res.status(500).json({ message: 'Unable to load categories.' }); } });

app.get('/api/cart', requireAuth, async (req, res) => { const db = await getDb(); const cart = await db.collection('carts').findOne({ userId: req.user._id }); res.json({ cart: cart || { userId: req.user._id, items: [] } }); });
app.put('/api/cart', requireAuth, async (req, res) => { try { const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100).map(i => ({ productId: String(i.productId), quantity: Math.max(1, Math.min(20, Number(i.quantity) || 1)), size: i.size || null })) : []; const db = await getDb(); await db.collection('carts').updateOne({ userId: req.user._id }, { $set: { userId: req.user._id, items, updatedAt: new Date() } }, { upsert: true }); res.json({ items }); } catch { res.status(400).json({ message: 'Invalid cart.' }); } });

app.get('/api/wishlist', requireAuth, async (req, res) => { const db = await getDb(); const rows = await db.collection('wishlists').find({ userId: req.user._id }).toArray(); const ids = rows.map(x => x.productId); const products = ids.length ? await db.collection('products').find({ _id: { $in: ids } }).toArray() : []; res.json({ products: products.map(productView) }); });
app.post('/api/wishlist/:productId', requireAuth, async (req, res) => { const db = await getDb(); const productId = safeObjectId(req.params.productId); if (!productId) return res.status(400).json({ message: 'Invalid product.' }); const existing = await db.collection('wishlists').findOne({ userId: req.user._id, productId }); if (existing) await db.collection('wishlists').deleteOne({ _id: existing._id }); else await db.collection('wishlists').insertOne({ userId: req.user._id, productId, createdAt: new Date() }); res.json({ wished: !existing }); });

app.post('/api/reviews/:productId', requireAuth, async (req, res) => { try { const db = await getDb(); const productId = safeObjectId(req.params.productId); const rating = Number(req.body.rating); const comment = String(req.body.comment || '').trim(); if (!productId || rating < 1 || rating > 5 || comment.length < 5 || comment.length > 1000) return res.status(400).json({ message: 'Invalid review.' }); const order = await db.collection('orders').findOne({ userId: req.user._id, 'items.productId': productId, status: 'delivered' }); if (!order) return res.status(403).json({ message: 'You can review products you have purchased and received.' }); await db.collection('reviews').updateOne({ productId, userId: req.user._id }, { $set: { productId, userId: req.user._id, rating, comment, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true }); const agg = await db.collection('reviews').aggregate([{ $match: { productId } }, { $group: { _id: '$productId', rating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }]).next(); await db.collection('products').updateOne({ _id: productId }, { $set: { rating: Number(agg?.rating || 0), reviewCount: agg?.reviewCount || 0 } }); res.json({ message: 'Review saved.' }); } catch { res.status(500).json({ message: 'Unable to save review.' }); } });
app.get('/api/reviews/:productId', async (req, res) => { const db = await getDb(); const productId = safeObjectId(req.params.productId); const reviews = productId ? await db.collection('reviews').find({ productId }).sort({ createdAt: -1 }).limit(50).toArray() : []; const users = await db.collection('users').find({ _id: { $in: reviews.map(r => r.userId) } }, { projection: { name: 1 } }).toArray(); const names = new Map(users.map(u => [u._id.toString(), u.name])); res.json({ reviews: reviews.map(r => ({ rating: r.rating, comment: r.comment, name: names.get(r.userId.toString()) || 'Verified customer', createdAt: r.createdAt })) }); });

app.post('/api/analytics', async (req, res) => { try { const db = await getDb(); const event = String(req.body.event || '').slice(0, 60); const payload = req.body.payload && typeof req.body.payload === 'object' ? req.body.payload : {}; if (!event) return res.status(400).end(); await db.collection('analytics').insertOne({ event, payload, path: String(req.body.path || '').slice(0, 300), userId: req.user?._id || null, createdAt: new Date() }); res.status(204).end(); } catch { res.status(204).end(); } });

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress, couponCode } = req.body; if (!Array.isArray(items) || !items.length || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.postalCode) return res.status(400).json({ message: 'Cart and shipping address are required.' });
    const db = await getDb(); const ids = items.map(i => safeObjectId(i.productId)).filter(Boolean); if (ids.length !== items.length) return res.status(400).json({ message: 'Invalid product in cart.' }); const products = await db.collection('products').find({ _id: { $in: ids } }).toArray(); const byId = new Map(products.map(p => [p._id.toString(), p])); let subtotal = 0; const orderItems = [];
    for (const item of items) { const p = byId.get(item.productId); const qty = Math.max(1, Math.min(20, Number(item.quantity) || 1)); if (!p || p.stock < qty) return res.status(409).json({ message: `${p?.title || 'Product'} is out of stock.` }); subtotal += p.price * qty; orderItems.push({ productId: p._id, title: p.title, price: p.price, quantity: qty, size: item.size || null, image: p.imglink || p.image || null }); }
    let discount = 0; let coupon = null; if (couponCode) { coupon = await db.collection('coupons').findOne({ code: String(couponCode).trim().toUpperCase(), active: true }); if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (!coupon.maxUses || coupon.usedCount < coupon.maxUses) && subtotal >= (coupon.minOrder || 0)) discount = coupon.type === 'percent' ? Math.min(subtotal, subtotal * coupon.value / 100) : Math.min(subtotal, coupon.value); }
    const shipping = subtotal - discount >= Number(process.env.FREE_SHIPPING_THRESHOLD || 5000) ? 0 : Number(process.env.SHIPPING_FEE || 199); const tax = Number(((subtotal - discount) * Number(process.env.TAX_RATE || 0.03)).toFixed(2)); const total = Number((subtotal - discount + shipping + tax).toFixed(2));
    const order = { userId: req.user._id, items: orderItems, shippingAddress: { name: String(shippingAddress.name || req.user.name), line1: String(shippingAddress.line1), line2: String(shippingAddress.line2 || ''), city: String(shippingAddress.city), state: String(shippingAddress.state || ''), postalCode: String(shippingAddress.postalCode), country: String(shippingAddress.country || 'India'), phone: String(shippingAddress.phone || '') }, pricing: { subtotal, discount, shipping, tax, total }, couponCode: coupon?.code || null, status: 'pending_payment', paymentStatus: 'unpaid', createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('orders').insertOne(order); order._id = result.insertedId; res.status(201).json({ order: { id: order._id.toString(), ...order, _id: undefined } });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Unable to create order.' }); }
});
app.get('/api/orders', requireAuth, async (req, res) => { const db = await getDb(); const orders = await db.collection('orders').find({ userId: req.user._id }).sort({ createdAt: -1 }).toArray(); res.json({ orders: orders.map(o => ({ ...o, id: o._id.toString(), _id: undefined })) }); });
app.get('/api/orders/:id', requireAuth, async (req, res) => { const db = await getDb(); const id = safeObjectId(req.params.id); const order = id ? await db.collection('orders').findOne({ _id: id, userId: req.user._id }) : null; if (!order) return res.status(404).json({ message: 'Order not found.' }); res.json({ order: { ...order, id: order._id.toString(), _id: undefined } }); });

async function requireRazorpay() { if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error('Razorpay is not configured.'); }
app.post('/api/payments/razorpay/order', requireAuth, async (req, res) => {
  try { await requireRazorpay(); const db = await getDb(); const order = await db.collection('orders').findOne({ _id: safeObjectId(req.body.orderId), userId: req.user._id, paymentStatus: 'unpaid' }); if (!order) return res.status(404).json({ message: 'Order not found.' }); const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64'); const r = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Math.round(order.pricing.total * 100), currency: process.env.CURRENCY || 'INR', receipt: order._id.toString() }) }); const data = await r.json(); if (!r.ok) throw new Error(data.error?.description || 'Razorpay order failed'); await db.collection('payments').insertOne({ orderId: order._id, gateway: 'razorpay', gatewayOrderId: data.id, amount: order.pricing.total, status: 'created', createdAt: new Date() }); res.json({ keyId: process.env.RAZORPAY_KEY_ID, razorpayOrder: data }); } catch (e) { console.error(e); res.status(503).json({ message: e.message || 'Payment gateway unavailable.' }); }
});
app.post('/api/payments/razorpay/verify', requireAuth, async (req, res) => {
  try { await requireRazorpay(); const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body; const db = await getDb(); const order = await db.collection('orders').findOne({ _id: safeObjectId(orderId), userId: req.user._id }); if (!order) return res.status(404).json({ message: 'Order not found.' }); const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex'); if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature || ''))) return res.status(400).json({ message: 'Invalid payment signature.' }); await db.collection('payments').updateOne({ orderId: order._id, gatewayOrderId: razorpay_order_id }, { $set: { gatewayPaymentId: razorpay_payment_id, signature: razorpay_signature, status: 'paid', paidAt: new Date() } }); await db.collection('orders').updateOne({ _id: order._id }, { $set: { paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date() } }); for (const item of order.items) await db.collection('products').updateOne({ _id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }); if (order.couponCode) await db.collection('coupons').updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } }); await db.collection('carts').deleteOne({ userId: req.user._id }); res.json({ message: 'Payment verified.', orderId }); } catch (e) { console.error(e); res.status(400).json({ message: 'Payment verification failed.' }); }
});

app.post('/api/contact', async (req, res) => { try { const name = String(req.body.name || '').trim(), email = normalizeEmail(req.body.email), message = String(req.body.message || '').trim(); if (name.length < 2 || !/^[^@]+@[^@]+\.[^@]+$/.test(email) || !message || message.length > 5000) return res.status(400).json({ message: 'Please provide valid contact details.' }); const db = await getDb(); await db.collection('contacts').insertOne({ name, email, message, submittedAt: new Date() }); res.status(201).json({ message: 'Your message has been received!' }); } catch { res.status(500).json({ message: 'Unable to submit your message.' }); } });

// Admin API
app.get('/api/admin/dashboard', requireAuth, requireRole('admin'), async (_req, res) => { const db = await getDb(); const [users, products, orders, revenue, lowStock] = await Promise.all([db.collection('users').countDocuments(), db.collection('products').countDocuments(), db.collection('orders').countDocuments(), db.collection('orders').aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]).next(), db.collection('products').countDocuments({ stock: { $lte: 5 } })]); res.json({ users, products, orders, revenue: revenue?.total || 0, lowStock }); });
app.get('/api/admin/products', requireAuth, requireRole('admin'), async (_req, res) => { const db = await getDb(); res.json({ products: (await db.collection('products').find().sort({ createdAt: -1 }).toArray()).map(productView) }); });
app.post('/api/admin/products', requireAuth, requireRole('admin'), async (req, res) => { try { const db = await getDb(); const body = req.body; const title = String(body.title || '').trim(); const price = Number(body.price); const slug = String(body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); if (!title || !Number.isFinite(price) || price < 0 || !slug) return res.status(400).json({ message: 'Title, slug and price are required.' }); const product = { title, slug, description: String(body.description || ''), category: String(body.category || 'Jewellery'), material: String(body.material || ''), gemstone: String(body.gemstone || ''), price, stock: Math.max(0, Number(body.stock) || 0), imglink: String(body.imglink || ''), images: Array.isArray(body.images) ? body.images.slice(0, 10) : [], tags: Array.isArray(body.tags) ? body.tags : [], featured: !!body.featured, createdAt: new Date(), updatedAt: new Date(), rating: 0, reviewCount: 0 }; const r = await db.collection('products').insertOne(product); product._id = r.insertedId; res.status(201).json({ product: productView(product) }); } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Slug already exists.' : 'Unable to create product.' }); } });
app.put('/api/admin/products/:id', requireAuth, requireRole('admin'), async (req, res) => { try { const db = await getDb(); const id = safeObjectId(req.params.id); if (!id) return res.status(400).json({ message: 'Invalid product.' }); const allowed = ['title','slug','description','category','material','gemstone','price','stock','imglink','images','tags','featured']; const set = {}; for (const k of allowed) if (req.body[k] !== undefined) set[k] = req.body[k]; set.updatedAt = new Date(); await db.collection('products').updateOne({ _id: id }, { $set: set }); res.json({ message: 'Product updated.' }); } catch { res.status(400).json({ message: 'Unable to update product.' }); } });
app.delete('/api/admin/products/:id', requireAuth, requireRole('admin'), async (req, res) => { const db = await getDb(); const id = safeObjectId(req.params.id); if (!id) return res.status(400).json({ message: 'Invalid product.' }); await db.collection('products').deleteOne({ _id: id }); res.json({ message: 'Product deleted.' }); });
app.get('/api/admin/orders', requireAuth, requireRole('admin'), async (_req, res) => { const db = await getDb(); const orders = await db.collection('orders').find().sort({ createdAt: -1 }).limit(500).toArray(); res.json({ orders: orders.map(o => ({ ...o, id: o._id.toString(), _id: undefined })) }); });
app.put('/api/admin/orders/:id', requireAuth, requireRole('admin'), async (req, res) => { const db = await getDb(); const id = safeObjectId(req.params.id); const status = String(req.body.status || ''); const allowed = ['pending_payment','confirmed','processing','shipped','delivered','cancelled','refunded']; if (!id || !allowed.includes(status)) return res.status(400).json({ message: 'Invalid order status.' }); await db.collection('orders').updateOne({ _id: id }, { $set: { status, trackingNumber: String(req.body.trackingNumber || ''), updatedAt: new Date() } }); await audit(db, req, 'order.status.updated', id.toString(), { status }); res.json({ message: 'Order updated.' }); });
app.get('/api/admin/users', requireAuth, requireRole('admin'), async (_req, res) => { const db = await getDb(); const users = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).limit(500).toArray(); res.json({ users: users.map(u => ({ ...publicUser(u), createdAt: u.createdAt, suspended: !!u.suspended })) }); });
app.put('/api/admin/users/:id', requireAuth, requireRole('admin'), async (req, res) => { const db = await getDb(); const id = safeObjectId(req.params.id); if (!id) return res.status(400).json({ message: 'Invalid user.' }); const set = {}; if (['customer','admin'].includes(req.body.role)) set.role = req.body.role; if (typeof req.body.suspended === 'boolean') set.suspended = req.body.suspended; await db.collection('users').updateOne({ _id: id }, { $set: set }); await audit(db, req, 'user.updated', id.toString(), set); res.json({ message: 'User updated.' }); });
app.get('/api/admin/coupons', requireAuth, requireRole('admin'), async (_req, res) => { const db = await getDb(); res.json({ coupons: await db.collection('coupons').find().sort({ createdAt: -1 }).toArray() }); });
app.post('/api/admin/coupons', requireAuth, requireRole('admin'), async (req, res) => { const db = await getDb(); const coupon = { code: String(req.body.code || '').trim().toUpperCase(), type: req.body.type === 'fixed' ? 'fixed' : 'percent', value: Number(req.body.value), minOrder: Number(req.body.minOrder || 0), maxUses: Number(req.body.maxUses || 0), usedCount: 0, active: true, expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null, createdAt: new Date() }; if (!coupon.code || coupon.value <= 0) return res.status(400).json({ message: 'Invalid coupon.' }); try { await db.collection('coupons').insertOne(coupon); res.status(201).json({ coupon }); } catch { res.status(409).json({ message: 'Coupon code already exists.' }); } });
app.get('/api/admin/analytics', requireAuth, requireRole('admin'), async (_req, res) => { const db = await getDb(); const events = await db.collection('analytics').aggregate([{ $group: { _id: '$event', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(); res.json({ events }); });

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'Internal server error.' }); });
module.exports = app;
if (require.main === module) app.listen(process.env.PORT || 5000, () => console.log(`API running on port ${process.env.PORT || 5000}`));
