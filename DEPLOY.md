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

### Steps
1. **Build**:
   ```bash
   npm run build:web
   ```
   This produces a `apps/web/dist` directory.

2. **Deploy**:
   You can connect your GitHub repository to Cloudflare Pages.
   - **Build Command**: `npm run build:web`
   - **Build Output Directory**: `apps/web/dist`
   - **Root Directory**: `/` (or leave empty if using root `package.json`).

   *Alternatively, deploy manually:*
   ```bash
   cd apps/web
   npm run build
   npx wrangler pages deploy dist --project-name=pharma-web
   ```

### Environment Variables
Set these in your Cloudflare Pages dashboard (Settings > Environment Variables):

- `VITE_SUPABASE_URL`: Your Supabase URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

---

## Deployment: Backend (`apps/api`)

The backend is a Cloudflare Worker using Hono.

### Steps
1. **Deploy**:
   ```bash
   npm run deploy:api
   ```
   This runs `wrangler deploy` in the `apps/api` directory.

2. **Custom Domain**:
   Update `apps/api/wrangler.toml` (or use Cloudflare Dashboard) to route `api.tutssolution.com` to this worker.

   Example `wrangler.toml` addition:
   ```toml
   routes = [
     { pattern = "api.tutssolution.com/*", zone_name = "tutssolution.com" }
   ]
   ```

### Environment Variables
Set these in `apps/api/.dev.vars` (local) or via `wrangler secret put` (production):

- `SUPABASE_URL`: Your Supabase URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Keep Secret!).

---

## Local Development Proxy
To proxy requests from frontend to backend locally:
- Frontend calls to `/api/*` can be configured to proxy to `http://localhost:8787/api/*` in `apps/web/vite.config.js`.

Current setup expects the Frontend to call the API directly (CORS is enabled on the Worker).
