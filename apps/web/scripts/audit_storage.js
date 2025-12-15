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

async function checkStorage() {
    console.log('🔍 Checking Storage Buckets...');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error listing buckets:', error.message);
        return;
    }

    const avatarBucket = buckets.find(b => b.name === 'avatars');

    if (avatarBucket) {
        console.log(`✅ Bucket 'avatars' EXISTS`);
        console.log(`   Public: ${avatarBucket.public}`);

        // Try to upload a test file
        const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload('test_check.txt', 'test content', { upsert: true });

        if (uploadError) {
            console.log(`❌ Service Role Upload FAILED: ${uploadError.message}`);
        } else {
            console.log(`✅ Service Role Upload SUCCESS`);
        }
    } else {
        console.log(`❌ Bucket 'avatars' DOES NOT EXIST`);
        console.log(`   ACTION REQUIRED: Run scripts/05_storage_avatars.sql`);
    }
}

checkStorage();
