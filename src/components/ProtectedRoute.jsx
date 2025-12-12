import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

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
            <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white gap-4">
                <div className="bg-red-500/10 p-4 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-red-500"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                </div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-slate-400">You do not have permission to view this page.</p>
                <button onClick={() => window.history.back()} className="text-indigo-400 hover:text-indigo-300 underline">
                    Go Back
                </button>
            </div>
        );
    }

    return children;
}
