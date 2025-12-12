import React from 'react';
import { Card } from "@/components/ui/card";
import { Lightbulb, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartTip({ tip }) {
    if (!tip) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl blur opacity-20" />
            <Card className="relative bg-zinc-900/80 border-amber-500/20 p-4 overflow-hidden">
                <div className="flex gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Smart Tip</span>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {tip}
                        </p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
