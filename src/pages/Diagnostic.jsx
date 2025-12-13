import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function DiagnosticPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const log = (msg, status = 'info') => {
        setResults(prev => [...prev, { msg, status, time: new Date().toLocaleTimeString() }]);
    };

    const runDiagnostics = async () => {
        setResults([]);
        setLoading(true);

        // 1. Check Environment Variables
        log('Checking environment variables...');
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!url || !key) {
            log(`❌ Missing env vars: URL=${!!url}, KEY=${!!key}`, 'error');
            setLoading(false);
            return;
        }
        log(`✅ Env vars loaded. URL ends with: ...${url?.slice(-20)}`, 'success');

        // 2. Check Session
        log('Checking session...');
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                log(`❌ Session error: ${error.message}`, 'error');
            } else if (!session) {
                log('⚠️ No active session - User is NOT logged in', 'warning');
            } else {
                log(`✅ Session found for: ${session.user.email}`, 'success');
            }
        } catch (e) {
            log(`❌ Session check crashed: ${e.message}`, 'error');
        }

        // 3. Test Database Read
        log('Testing database read (topics)...');
        try {
            const { data, error } = await supabase.from('topics').select('*').limit(1);
            if (error) {
                log(`❌ Read error: ${error.message} (Code: ${error.code})`, 'error');
            } else {
                log(`✅ Read successful. Got ${data?.length || 0} rows`, 'success');
            }
        } catch (e) {
            log(`❌ Read crashed: ${e.message}`, 'error');
        }

        // 4. Test Database Write
        log('Testing database write (topics)...');
        try {
            const testData = { title: `Test-${Date.now()}`, name: `Test-${Date.now()}`, description: 'Diagnostic test' };
            const { data, error } = await supabase.from('topics').insert(testData).select().single();
            if (error) {
                log(`❌ Write error: ${error.message} (Code: ${error.code}, Details: ${error.details})`, 'error');
            } else {
                log(`✅ Write successful! Created topic ID: ${data?.id}`, 'success');
                // Cleanup
                await supabase.from('topics').delete().eq('id', data.id);
                log('✅ Cleanup successful', 'success');
            }
        } catch (e) {
            log(`❌ Write crashed: ${e.message}`, 'error');
        }

        // 5. Test Chat Write
        log('Testing chat message write...');
        try {
            const testMsg = {
                content: 'Diagnostic test message',
                user_email: 'diagnostic@test.com',
                user_name: 'Diagnostic Bot'
            };
            const { data, error } = await supabase.from('chat_messages').insert(testMsg).select().single();
            if (error) {
                log(`❌ Chat write error: ${error.message} (Code: ${error.code})`, 'error');
            } else {
                log(`✅ Chat write successful! Message ID: ${data?.id}`, 'success');
                await supabase.from('chat_messages').delete().eq('id', data.id);
            }
        } catch (e) {
            log(`❌ Chat write crashed: ${e.message}`, 'error');
        }

        setLoading(false);
        log('--- Diagnostics Complete ---');
    };

    const handleLogin = async () => {
        log(`Attempting login for: ${email}...`);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                log(`❌ Login failed: ${error.message}`, 'error');
            } else {
                log(`✅ Login successful! User: ${data.user?.email}`, 'success');
            }
        } catch (e) {
            log(`❌ Login crashed: ${e.message}`, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">🔧 Supabase Diagnostics</h1>

                <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Login Test</h2>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                        />
                        <Button onClick={handleLogin} className="bg-blue-600">Login</Button>
                    </div>
                </Card>

                <Button
                    onClick={runDiagnostics}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Run Full Diagnostics
                </Button>

                <Card className="bg-zinc-900 border-zinc-800 p-4 max-h-[500px] overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4">Results</h2>
                    {results.length === 0 ? (
                        <p className="text-slate-500">Click "Run Full Diagnostics" to start...</p>
                    ) : (
                        <div className="space-y-2 font-mono text-sm">
                            {results.map((r, i) => (
                                <div key={i} className={`flex items-start gap-2 ${r.status === 'error' ? 'text-red-400' :
                                        r.status === 'success' ? 'text-green-400' :
                                            r.status === 'warning' ? 'text-yellow-400' : 'text-slate-300'
                                    }`}>
                                    <span className="text-slate-600">[{r.time}]</span>
                                    <span>{r.msg}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                    <h3 className="font-semibold mb-2">Quick Actions</h3>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
                            className="border-zinc-700"
                        >
                            🔄 Factory Reset (Clear Storage)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = '/login'}
                            className="border-zinc-700"
                        >
                            🚪 Go to Login Page
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
