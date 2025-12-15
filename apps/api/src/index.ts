import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS Middleware
app.use('/*', cors({
    origin: ['https://tutssolution.com', 'https://www.tutssolution.com'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// Health Check
app.get('/health', (c) => c.json({ ok: true }));

// Example API Endpoint
app.get('/api/hello', (c) => {
    return c.json({
        message: 'Hello from Cloudflare Worker API!',
        timestamp: new Date().toISOString()
    });
});

export default app;
