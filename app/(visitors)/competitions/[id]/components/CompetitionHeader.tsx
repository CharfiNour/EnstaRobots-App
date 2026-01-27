"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, MapPin } from 'lucide-react';
import { LiveBadge } from '@/components/common/LiveBadge';
import { getCategoryMetadata } from '@/lib/constants';

interface CompetitionHeaderProps {
    title: string;
    category: string;
    arena: string;
    isActuallyLive: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLiveClick?: () => void;
}

export function CompetitionHeader({ title, category, arena, isActuallyLive, activeTab, setActiveTab, onLiveClick }: CompetitionHeaderProps) {
    const [mounted, setMounted] = useState(false);
    const metadata = getCategoryMetadata(category);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Safely extract theme colors from metadata
    const colorMatch = metadata?.color?.match(/from-([\w-]+)/);
    const baseColor = colorMatch ? colorMatch[1] : 'accent';
    const themeColor = `text-${baseColor}`;
    const themeBorder = `border-${baseColor}/50`;
    const themeBg = `bg-${baseColor}`;

    return (
        <div className="relative overflow-hidden border-b border-white/10 bg-[#050914] text-white">
            {/* Background Accents */}
            <div className={`absolute inset-y-0 left-0 w-1.5 ${themeBg} opacity-90 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]`} />
            <div className={`absolute inset-0 opacity-[0.2] ${themeBg}`} />

            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <div className="container mx-auto px-4 pt-10 pb-6 md:pb-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6 md:gap-12">
                        {/* Icon Stage */}
                        <div className="relative group shrink-0">
                            <div className={`absolute inset-0 opacity-50 blur-3xl rounded-full ${themeBg}`} />
                            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-black/60 border border-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-2xl shadow-2xl overflow-hidden">
                                <Trophy className={`w-12 h-12 md:w-16 md:h-16 ${themeColor} filter drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]`} />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-1/2 w-full animate-scanline" />
                            </div>
                            {mounted && isActuallyLive && (
                                <div className="absolute -top-1 -right-1">
                                    <div className="relative w-6 h-6 bg-red-500 rounded-full border-4 border-[#050914]" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl md:text-7xl font-black bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent tracking-[0.02em] uppercase italic leading-none truncate mb-4 md:mb-6"
                            >
                                {title}
                            </motion.h1>

                            <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                <div className={`flex items-center gap-2 md:gap-3 px-4 py-2 rounded-full bg-white/5 border ${themeBorder} backdrop-blur-md shadow-xl`}>
                                    <MapPin className={`w-4 h-4 ${themeColor}`} />
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                        {arena}
                                    </span>
                                </div>

                                {mounted && isActuallyLive && (
                                    <button
                                        onClick={onLiveClick}
                                        className="group flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 hover:bg-red-500/20 transition-all backdrop-blur-md"
                                    >
                                        <LiveBadge size="sm" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                        <div className="flex gap-1 p-1 bg-white/5 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl w-full md:w-fit">
                            {['teams', 'matches'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 md:flex-none px-6 py-2.5 md:px-10 md:py-3 rounded-lg font-black text-[10px] md:text-[12px] uppercase tracking-[0.25em] transition-all duration-500 relative overflow-hidden group/tab ${activeTab === tab
                                        ? 'bg-accent text-white shadow-[0_0_25px_rgba(var(--accent-rgb),0.4)] ring-1 ring-white/30'
                                        : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="relative z-10">{tab}</span>
                                    {activeTab === tab && (
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
