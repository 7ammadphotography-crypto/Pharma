# Deployment Guide

This repository is a monorepo containing:
1. **Frontend (`apps/web`)**: Deployed to Cloudflare Pages.
2. **Backend (`apps/api`)**: Deployed to Cloudflare Workers.

## Prerequisites

- Node.js 18+ installed.
- Cloudflare account.
- Wrangler CLI installed (`npm install -g wrangler`).

## Project Structure

```
.
├── apps/
│   ├── web/     # Vite + React Frontend
│   └── api/     # Hono + Cloudflare Worker Backend
├── package.json # Root workspace config
```

## Quick Start (Local Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Frontend**:
   ```bash
   npm run dev:web
   ```
   Access at `http://localhost:5173`.

3. **Run Backend**:
   ```bash
   npm run dev:api
   ```
   Access at `http://localhost:8787` (or configured port).

---

## Deployment: Frontend (`apps/web`)

The frontend is a static site built with Vite. It should be deployed to **Cloudflare Pages**.

### Configuration Options
You have two ways to configure the build in Cloudflare Pages:

**Option A: Root-based (Recommended for Monorepos)**
- **Root Directory**: `apps/web` (This ensures specific dependency handling)
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`

**Option B: Repo-root based**
- **Root Directory**: `/` (Empty)
- **Build Command**: `npm run build:web`
- **Build Output Directory**: `apps/web/dist`

### Environment Variables (Pages)
Set these in your Cloudflare Pages dashboard (Settings > Environment Variables):

- `VITE_SUPABASE_URL`: Your Supabase URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
- `VITE_API_BASE_URL`: `https://api.tutssolution.com` (or your worker URL).

### Supabase Auth Configuration
In your Supabase Dashboard (Authentication > URL Configuration):
- **Site URL**: `https://tutssolution.com`
- **Redirect URLs**:
  - `https://tutssolution.com/*`
  - `https://www.tutssolution.com/*`
  - `http://localhost:5173/*` (for local dev)

---

## Deployment: Backend (`apps/api`)

The backend is a Cloudflare Worker using Hono.

### Steps
1. **Deploy**:
   ```bash
   npm run deploy:api
   ```

2. **Secrets**:
   Run these commands locally to set production secrets:
   ```bash
   npx wrangler secret put SUPABASE_URL --name pharma-api
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name pharma-api
   ```

3. **Custom Domain**:
   To route `api.tutssolution.com` to your worker, add this to `apps/api/wrangler.toml`:
   ```toml
   routes = [
     { pattern = "api.tutssolution.com/*", zone_name = "tutssolution.com" }
   ]
   ```

---

## Local Development Proxy
To proxy requests from frontend to backend locally:
- Frontend calls to `/api/*` can be configured to proxy to `http://localhost:8787/api/*` in `apps/web/vite.config.js`.

Current setup expects the Frontend to call the API directly (CORS is enabled on the Worker).
