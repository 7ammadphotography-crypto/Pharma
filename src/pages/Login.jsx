import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [loading, setLoading] = useState(false);

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signIn({ email, password });
        if (error) {
            toast.error('Login Failed', { description: error.message });
        } else {
            toast.success('Welcome back!');
            navigate(from, { replace: true });
        }
        setLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signUp({ email: newEmail, password: newPassword, fullName: newName });
        if (error) {
            toast.error('Signup Failed', { description: error.message });
        } else {
            toast.success('Account created! Please check your email.');
            // Optionally auto-login if Supabase is set to not require email confirmation
            // For now, let's assume they might need to confirm or can just login.
            navigate(from, { replace: true });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur-xl p-6 relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        Pharma Target
                    </h1>
                    <p className="text-slate-400 text-sm">Your intelligent study companion</p>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-800/50">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Email</label>
                                <Input
                                    type="email"
                                    placeholder="doctor@example.com"
                                    className="bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-10 mt-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center">Sign In <ArrowRight className="w-4 h-4 ml-2" /></span>}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Full Name</label>
                                <Input
                                    type="text"
                                    placeholder="Dr. John Doe"
                                    className="bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Email</label>
                                <Input
                                    type="email"
                                    placeholder="doctor@example.com"
                                    className="bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 h-10 mt-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
