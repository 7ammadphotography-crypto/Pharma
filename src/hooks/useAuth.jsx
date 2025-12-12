import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                let p = await fetchProfile(session.user.id);
                if (!p) {
                    const { error } = await supabase.from('profiles').upsert({
                        id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.user_metadata?.full_name || 'Student',
                        role: 'student'
                    });
                    if (!error) p = await fetchProfile(session.user.id);
                }
                setProfile(p);
            }
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                let p = await fetchProfile(session.user.id);
                if (!p) {
                    const { error } = await supabase.from('profiles').upsert({
                        id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.user_metadata?.full_name || 'Student',
                        role: 'student'
                    });
                    if (!error) p = await fetchProfile(session.user.id);
                }
                setProfile(p);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async ({ email, password, fullName }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        return { data, error };
    };

    const signIn = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signInWithOAuth = async (provider) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin + '/home',
            },
        });
        return { data, error };
    };

    const resetPassword = async (email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
        return { data, error };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    const value = {
        user: profile ? { ...user, ...profile } : user, // Merge auth user with profile data
        fullProfile: profile,
        loading,
        signUp,
        signIn,
        signInWithOAuth,
        resetPassword,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
