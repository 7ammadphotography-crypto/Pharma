
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const optional = ['SUPABASE_SERVICE_ROLE_KEY'];

let missing = false;

required.forEach(key => {
    if (!process.env[key]) {
        console.error(`❌ Missing required env var: ${key}`);
        missing = true;
    } else {
        console.log(`✅ ${key} is set`);
    }
});

optional.forEach(key => {
    if (!process.env[key]) {
        console.warn(`⚠️  Optional env var missing (needed for seed/admin): ${key}`);
    } else {
        console.log(`✅ ${key} is set (Server-only)`);
    }
});

if (missing) {
    process.exit(1);
} else {
    console.log('🎉 Environment check passed!');
    process.exit(0);
}
