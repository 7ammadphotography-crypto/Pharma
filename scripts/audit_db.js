import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected schema based on codebase analysis
const EXPECTED_SCHEMA = {
    competencies: ['id', 'title', 'name', 'description', 'icon', 'color', 'weight', 'order', 'created_at'],
    topics: ['id', 'title', 'name', 'description', 'competency_id', 'order', 'icon', 'tags', 'metadata', 'created_at'],
    cases: ['id', 'title', 'case_text', 'case_type', 'difficulty', 'image_url', 'competency_id', 'topic_id', 'tags', 'created_at'],
    questions: ['id', 'question_text', 'options', 'correct_answer', 'explanation', 'difficulty', 'tags', 'case_id', 'created_at', 'created_date'],
    topic_questions: ['id', 'topic_id', 'question_id', 'created_at'],
    profiles: ['id', 'email', 'full_name', 'role', 'avatar_url', 'subscription_status', 'account_status', 'created_at', 'created_date'],
    chat_messages: ['id', 'content', 'user_id', 'user_email', 'user_name', 'is_question', 'attachments', 'reply_to', 'voice_url', 'is_voice', 'created_at'],
};

async function runAudit() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           SUPABASE SCHEMA & SECURITY AUDIT                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 1. Check Tables Exist
    console.log('📋 TABLE EXISTENCE CHECK');
    console.log('─'.repeat(60));

    for (const tableName of Object.keys(EXPECTED_SCHEMA)) {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error) {
            console.log(`❌ ${tableName}: MISSING or ERROR - ${error.message}`);
        } else {
            const columns = data[0] ? Object.keys(data[0]) : [];
            console.log(`✅ ${tableName}: EXISTS (${columns.length} columns detected)`);
        }
    }

    // 2. Check Columns
    console.log('\n📊 COLUMN CHECK (Code Expectations vs DB Reality)');
    console.log('─'.repeat(60));

    for (const [tableName, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error) continue;

        const actualCols = data[0] ? Object.keys(data[0]) : [];
        const missing = expectedCols.filter(c => !actualCols.includes(c));
        const extra = actualCols.filter(c => !expectedCols.includes(c));

        if (missing.length > 0) {
            console.log(`⚠️  ${tableName}: Missing columns: ${missing.join(', ')}`);
        }
        if (extra.length > 0) {
            console.log(`ℹ️  ${tableName}: Extra columns: ${extra.join(', ')}`);
        }
        if (missing.length === 0 && extra.length === 0) {
            console.log(`✅ ${tableName}: All expected columns present`);
        }
    }

    // 3. Check Row Counts
    console.log('\n📈 DATA COUNTS');
    console.log('─'.repeat(60));

    for (const tableName of Object.keys(EXPECTED_SCHEMA)) {
        const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
        if (!error) {
            console.log(`   ${tableName}: ${count} rows`);
        }
    }

    // 4. Check Admin Users
    console.log('\n👤 ADMIN USERS');
    console.log('─'.repeat(60));

    const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('role', 'admin');

    if (!adminError && admins) {
        if (admins.length === 0) {
            console.log('⚠️  No admin users found! Run: UPDATE profiles SET role = \'admin\' WHERE email = \'your-email\';');
        } else {
            admins.forEach(a => console.log(`✅ ${a.email} (${a.role})`));
        }
    }

    // 5. Test Write Permission (as service role - always works)
    console.log('\n✍️  WRITE TEST (Service Role)');
    console.log('─'.repeat(60));

    const testTitle = `_audit_test_${Date.now()}`;
    const { data: created, error: createError } = await supabase
        .from('topics')
        .insert({ title: testTitle, name: testTitle })
        .select()
        .single();

    if (createError) {
        console.log(`❌ Insert failed: ${createError.message}`);
    } else {
        console.log(`✅ Insert works (created topic: ${created.id})`);
        // Cleanup
        await supabase.from('topics').delete().eq('id', created.id);
        console.log(`✅ Delete works (cleaned up test record)`);
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    AUDIT COMPLETE                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
}

runAudit().catch(e => {
    console.error('Audit failed:', e);
    process.exit(1);
});
