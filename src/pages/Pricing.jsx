import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown, Sparkles, Shield, Zap, BookOpen, Brain, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckout', {
        priceId: 'price_1Sam8EQZ1aPDdbmXk5FQKTyy' // Pharma Target monthly - $100/month
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSubscribed = user?.subscription_status === 'active';

  const features = [
    { icon: BookOpen, text: 'Full access to question bank' },
    { icon: Brain, text: 'PEBC mock exams' },
    { icon: Sparkles, text: 'AI study assistant' },
    { icon: Target, text: 'Advanced performance analytics' },
    { icon: Shield, text: 'AI-powered personalized review' },
    { icon: Zap, text: 'Continuous content updates' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 rounded-full mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-medium">Premium Subscription</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Invest in Your Professional Future
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Get full access to all the tools and resources you need to succeed in the PEBC exam
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto"
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-[2px] rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-50 blur-xl" />
            
            <div className="relative bg-[#0a0a0f] rounded-3xl p-8">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 text-sm">
                  Most Popular
                </Badge>
              </div>

              {/* Plan Info */}
              <div className="text-center mb-8 pt-4">
                <h2 className="text-2xl font-bold text-white mb-2">Pharma Target Premium</h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-white">$100</span>
                  <span className="text-slate-400">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-white">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              {isSubscribed ? (
                <div className="text-center">
                  <Badge className="bg-green-500/20 text-green-400 text-lg px-6 py-2">
                    <Check className="w-5 h-5 mr-2" />
                    You are already subscribed
                  </Badge>
                  <Link to={createPageUrl('Profile')}>
                    <Button variant="outline" className="w-full mt-4 border-slate-700 text-slate-300">
                      Manage Subscription
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              )}

              {/* Guarantee */}
              <p className="text-center text-slate-500 text-sm mt-4">
                <Shield className="w-4 h-4 inline mr-1" />
                7-day money-back guarantee
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}