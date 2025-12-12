import { createClient } from '@base44/sdk';

// Development mode detection
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Create a client with authentication required
export const base44 = createClient({
  appId: "692c839250a02789ff249382",
  requiresAuth: !isDev // Disable auth requirement in development
});
