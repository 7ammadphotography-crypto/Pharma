import React from 'react';
import { X, Users, Image as ImageIcon, Video, FileText, Bell, Search, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import moment from 'moment';

export default function ChatSidebar({ isOpen, onClose, user, onlineUsers = [], media = [] }) {
    if (!isOpen) return null;

    const images = media.filter(m => m.match(/\.(jpg|jpeg|png|gif|webp)$/i)).slice(0, 6);
    const files = media.filter(m => !m.match(/\.(jpg|jpeg|png|gif|webp)$/i)).slice(0, 5);

    return (
        <div className="w-80 border-l border-white/5 bg-[#0f0f1e] flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white">Group Info</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Group Profile */}
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-1">General Chat</h2>
                    <p className="text-xs text-slate-400">Created by System</p>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-4 py-4 border-y border-white/5">
                    <div className="text-center">
                        <p className="text-white font-bold">{onlineUsers.length}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Online</p>
                    </div>
                    <div className="w-px bg-white/5"></div>
                    <div className="text-center">
                        <p className="text-white font-bold">{media.length}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Media</p>
                    </div>
                </div>

                {/* Media Grid */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shared Media</h4>
                        <Button variant="link" className="text-xs text-indigo-400 h-auto p-0 hover:text-indigo-300">View all</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {images.map((img, i) => (
                            <div key={i} className="aspect-square rounded-lg bg-zinc-800 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group" onClick={() => window.open(img, '_blank')}>
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {images.length === 0 && <p className="col-span-3 text-center text-xs text-slate-500 py-4">No media shared yet</p>}
                    </div>
                </div>

                {/* Members */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Members (Online)</h4>
                    </div>
                    <div className="space-y-3">
                        {onlineUsers.map((u, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-medium text-white">
                                        {u.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0f0f1e]"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{u}</p>
                                    <p className="text-xs text-emerald-400">Online</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
