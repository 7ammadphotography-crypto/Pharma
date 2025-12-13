import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns for: quiz_attempts, user_points, bookmarked_questions');

    const tables = ['quiz_attempts', 'user_points', 'bookmarked_questions'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
            const cols = data[0] ? Object.keys(data[0]) : 'No rows to infer columns';
            console.log(`✅ ${table} columns:`, cols);
        }
    }
}

checkColumns();
