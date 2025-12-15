import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionGuard({ children, fallback }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isSubscribed = user?.subscription_status === 'active';

  if (isSubscribed) {
    return children;
  }

  // Show fallback or default locked screen
  if (fallback) {
    return fallback;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <Card className="glass-card border-0 p-8 max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          Premium Content
        </h2>
        
        <p className="text-slate-400 mb-6">
          This content is only available to subscribers. Subscribe now to access all features.
        </p>

        <Link to={createPageUrl('Pricing')}>
          <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Crown className="w-5 h-5 mr-2" />
            Subscribe Now
          </Button>
        </Link>

        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="w-full mt-3 text-slate-400">
            Back to Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}