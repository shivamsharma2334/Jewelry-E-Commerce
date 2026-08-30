# ShivAmbar Jewels — Production MERN E-Commerce

Production-oriented MERN jewelry storefront with MongoDB Atlas, secure cookie authentication, Google Sign-In, email verification/password reset, wishlist, reviews, persistent cart, checkout, Razorpay payments, orders, coupons, analytics, admin APIs, and Vercel deployment configuration.

## Included

- MongoDB Atlas with indexes and seed script
- Strong bcrypt password policy
- HttpOnly access/refresh cookies + rotating refresh tokens
- Google Identity Services login/signup
- Email verification and password reset via Resend
- Product search, categories, sorting and pagination
- Persistent cart and wishlist
- Verified-purchase reviews
- Server-side order totals, shipping, tax and coupons
- Razorpay order creation + signature verification
- Order history and status workflow
- Admin dashboard, products, orders, users and coupons
- Analytics event collection
- Security headers, CORS allow-list, rate limiting and audit logs
- Vercel serverless API + Vite SPA rewrites

## Local development

1. Install Node 20+.
2. Configure `Backend/.env` from `.env.example` (or root env if your host injects it).
3. Install dependencies:

```bash
cd Backend && npm install
cd ../Frontend && npm install
```

4. Seed MongoDB Atlas products:

```bash
cd Backend
npm run seed
```

5. Start API:

```bash
npm start
```

6. Start frontend in another terminal:

```bash
cd Frontend
npm run dev
```

## Make an admin

After creating your first account, update that user in Atlas:

```js
db.users.updateOne({email:"your@email.com"}, {$set:{role:"admin"}})
```

Then visit `/admin`.

## Google OAuth

Create a Google OAuth Web Client ID and add your Vercel production domain and local development origin to the authorized JavaScript origins. Put the same client ID in `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

## Email

Resend is optional in development but should be configured for production. Set `RESEND_API_KEY`, `EMAIL_FROM`, and a verified sending domain. Verification and password-reset links are single-use/expiring tokens stored hashed in MongoDB.

## Razorpay

Create live Razorpay keys and set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. The server creates gateway orders and verifies the returned signature before marking an order paid. For a full production rollout, also configure Razorpay webhooks and reconcile webhook events in your operations process.

## Vercel

Deploy the repository root. The included `vercel.json` builds `Frontend` and routes `/api/*` to `api/index.js`.

Set these Vercel environment variables:

- `MONGO_URI`
- `MONGO_DB_NAME`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`
- `FRONTEND_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CURRENCY`
- `FREE_SHIPPING_THRESHOLD`
- `SHIPPING_FEE`
- `TAX_RATE`

Then redeploy and run `npm run seed` once against the Atlas database.

## Production checklist

- Use a custom domain and HTTPS.
- Restrict MongoDB Atlas network access appropriately.
- Rotate secrets if they were ever exposed.
- Verify Google OAuth origins and redirect configuration.
- Verify Resend domain.
- Use Razorpay live keys only after testing in test mode.
- Configure payment webhooks/reconciliation.
- Add uptime/error monitoring (Sentry or equivalent).
- Add automated unit/integration/E2E tests before high-volume traffic.
- Back up MongoDB and test restore procedures.
- Add legal pages: privacy, terms, returns, shipping and refund policy.
