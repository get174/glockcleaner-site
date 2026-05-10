# Vercel deployment checklist (glockcleaner site)

## 1) Ensure Vite env vars are set as **Build-time**
Set these in Vercel Project → Settings → Environment Variables (for Preview + Production):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

> `VITE_*` variables are used by the browser bundle, so they must be available during `vite build`.

## 2) Ensure PayPal server env vars are set for **Server/Functions**
Set these in Vercel Project → Settings → Environment Variables:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_MODE` (`sandbox` or `live`)

## 3) Build & deploy
- Use Vercel default Build Command: `npm run build`
- Output directory: `dist`

## 4) API endpoints availability
Your PayPal API routes should be deployed automatically because they exist under:
- `api/paypal/create-order.ts`  → `POST /api/paypal/create-order`
- `api/paypal/capture-order.ts` → `POST /api/paypal/capture-order`

## 5) Validate routing
- SPA rewrite in `vercel.json` should not capture `/api/*`.
- Current `vercel.json` keeps `/api/*` intact.

## 6) Smoke tests after deploy
- Open homepage `/`
- Login/signup flow works
- Create PayPal order: `POST /api/paypal/create-order` with body `{ amount, currency, planName? }`
- Capture PayPal order: `POST /api/paypal/capture-order` with body `{ orderID }`

