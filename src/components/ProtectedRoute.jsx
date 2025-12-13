import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading, fullProfile } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && fullProfile?.role !== 'admin') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-xl max-w-md text-center shadow-2xl relative z-10">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Access Restricted</h1>
                    <p className="text-slate-400 mb-8">
                        This area is reserved for administrators only. Your current role does not have the necessary permissions.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button variant="outline" onClick={() => window.history.back()} className="border-zinc-700 hover:bg-zinc-800">
                            Go Back
                        </Button>
                        <Button onClick={() => window.location.href = '/home'} className="bg-indigo-600 hover:bg-indigo-700">
                            Return Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
