import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- TOPICS Columns ---');
    // We can't query information_schema easily via JS client due to permissions usually.
    // Instead, let's try to SELECT one row from topics and chat_messages to see what keys return (if any)
    // or insert a dummy row and see the error.

    // Actually, 'rpc' is best if we had an SQL function, but we don't.
    // Let's try to inspect via a failed insert which might return schema info, or just list rows.

    const { data: topicData, error: topicError } = await supabase.from('topics').select('*').limit(1);
    if (topicData) {
        if (topicData.length > 0) {
            console.log(Object.keys(topicData[0]));
        } else {
            console.log('No topics found to infer schema.');
        }
    } else {
        console.error('Topics Error:', topicError);
    }

    console.log('\n--- CHAT_MESSAGES Columns ---');
    const { data: chatData, error: chatError } = await supabase.from('chat_messages').select('*').limit(1);
    if (chatData) {
        if (chatData.length > 0) {
            console.log(Object.keys(chatData[0]));
        } else {
            console.log('No messages found to infer schema.');
        }
    } else {
        console.error('Chat Error:', chatError);
    }
}

checkSchema();
