import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS Middleware
app.use('/*', cors({
    origin: ['https://tutssolution.com', 'https://www.tutssolution.com', 'http://localhost:5173', 'http://localhost:5174'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// Health Check
app.get('/health', (c) => c.json({ status: 'ok', service: 'pharma-api' }));

// Example API Endpoint
app.get('/api/hello', (c) => {
    return c.json({
        message: 'Hello from Cloudflare Worker API!',
        timestamp: new Date().toISOString()
    });
});

export default app;
