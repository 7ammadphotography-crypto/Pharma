import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Social Icons (SVG)
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 4.19-.94 1.74.07 3.3.74 4.32 2.22-3.66 1.95-3.05 6.66.41 8.24-.77 1.77-1.89 3.51-3.64 5.21-.66.68-1.52.95-2.36 1.1zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.38-2.12 4.27-3.74 4.25z" />
    </svg>
);

export default function Login() {
    const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/home';

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        const { error } = await signUp({ email: newEmail, password: newPassword, fullName: newName });
        if (error) {
            toast.error('Signup Failed', { description: error.message });
        } else {
            toast.success('Account created! Please check your email.');
            navigate(from, { replace: true });
        }
        setLoading(false);
    };

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        const { error } = await signInWithOAuth(provider);
        if (error) {
            toast.error(`${provider} Login Failed`, { description: error.message });
            setLoading(false);
        }
        // Redirect handled by supabase, but if we stay here:
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            toast.error('Please enter your email address');
            return;
        }
        setLoading(true);
        const { error } = await resetPassword(forgotEmail);
        if (error) {
            toast.error('Reset Failed', { description: error.message });
        } else {
            setResetSent(true);
            toast.success('Check your email for the reset link');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
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
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="email"
                                        placeholder="doctor@example.com"
                                        className="pl-9 bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <label className="text-xs font-medium text-slate-400">Password</label>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300">
                                                Forgot Password?
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-zinc-900 border-zinc-800 text-slate-200">
                                            <DialogHeader>
                                                <DialogTitle>Reset Password</DialogTitle>
                                                <DialogDescription className="text-slate-400">
                                                    Enter your email address and we'll send you a link to reset your password.
                                                </DialogDescription>
                                            </DialogHeader>
                                            {!resetSent ? (
                                                <div className="space-y-4 pt-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-slate-400">Email</label>
                                                        <Input
                                                            type="email"
                                                            placeholder="doctor@example.com"
                                                            className="bg-zinc-950/50 border-zinc-700"
                                                            value={forgotEmail}
                                                            onChange={(e) => setForgotEmail(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button onClick={handleForgotPassword} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-green-400">
                                                    Check your inbox! Reset link sent.
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-9 pr-10 bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-10 mt-2 font-medium"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center">Sign In <ArrowRight className="w-4 h-4 ml-2" /></span>}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form onSubmit={handleSignup} className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="text"
                                        placeholder="Dr. John Doe"
                                        className="pl-9 bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="email"
                                        placeholder="doctor@example.com"
                                        className="pl-9 bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create password"
                                        className="pl-9 pr-10 bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm password"
                                        className="pl-9 pr-10 bg-zinc-950/50 border-zinc-800 focus:border-indigo-500"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 h-10 mt-2 font-medium"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-900 px-2 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 text-slate-300"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                        <span className="ml-2">Google</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleSocialLogin('apple')}
                        disabled={loading}
                        className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 text-slate-300"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AppleIcon />}
                        <span className="ml-2">Apple</span>
                    </Button>
                </div>

            </Card>
        </div>
    );
}
