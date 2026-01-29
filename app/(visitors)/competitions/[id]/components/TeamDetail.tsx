"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Cpu, Building2, Crown,
    Image as ImageIcon, Target, Zap,
    Globe, Activity, Users
} from 'lucide-react';
import { Team } from '@/lib/teams';
import { getCategoryMetadata } from '@/lib/constants';

interface TeamDetailProps {
    team: Team | null;
    currentCategory: string;
    onBack?: () => void;
    isActuallyLive?: boolean;
    liveScore?: any;
}

export const TeamDetail = React.memo(({ team, currentCategory, onBack, isActuallyLive, liveScore }: TeamDetailProps) => {
    const [mounted, setMounted] = useState(false);
    const metadata = getCategoryMetadata(currentCategory);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Format time helper (ms -> MM:SS:mmm)
    const formatTime = (ms: number) => {
        if (!ms && ms !== 0) return "--:--:--";
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const millis = ms % 1000;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
    };

    // Safely extract theme colors from metadata
    const colorMatch = metadata?.color?.match(/from-([\w-]+)/);
    const baseColor = colorMatch ? colorMatch[1] : 'accent';
    const themeColor = `text-${baseColor}`;
    const themeBorder = `border-${baseColor}`;
    const themeBg = `bg-${baseColor}`;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={team?.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white/70 backdrop-blur-xl border border-card-border rounded-[2.5rem] overflow-hidden shadow-2xl group relative self-start"
            >
                {/* Mobile Back Button */}
                {onBack && (
                    <div className="lg:hidden absolute top-4 left-4 z-20">
                        <button
                            onClick={onBack}
                            className="p-3 bg-white/60 backdrop-blur-xl rounded-full text-foreground hover:bg-white/90 transition-all border border-card-border hover:scale-110 shadow-xl"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                )}

                {/* Hero Section */}
                <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                    {team?.photo ? (
                        <img
                            src={team.photo}
                            alt="Robot"
                            loading="lazy"
                            width={400}
                            height={400}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="text-center p-6 opacity-40">
                            <Cpu size={40} className="mx-auto mb-3 text-muted-foreground" />
                            <p className="font-black uppercase tracking-tighter text-[9px]">Visual Feed Offline</p>
                        </div>
                    )}

                    {/* Sector Badge - Restored Theme Color */}
                    <div className="absolute top-4 right-4 z-20">
                        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-md shadow-lg ${themeBg}/30 border-${baseColor}/50 text-white min-w-fit shadow-${baseColor}/20`}>
                            {currentCategory.toLowerCase().includes('fight') ? <Target size={14} className={themeColor} /> :
                                currentCategory.toLowerCase().includes('line') ? <Zap size={14} className={themeColor} /> :
                                    currentCategory.toLowerCase().includes('terrain') ? <Globe size={14} className={themeColor} /> :
                                        <Activity size={14} className={themeColor} />}
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none drop-shadow-sm">
                                {metadata?.name || currentCategory.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>

                    <div className="absolute bottom-6 left-6 right-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 shrink-0 overflow-hidden shadow-2xl">
                                {team?.logo ? (
                                    <img
                                        src={team.logo}
                                        alt="Club"
                                        loading="lazy"
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/40">
                                        <ImageIcon size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-[22px] font-black text-white tracking-tighter leading-none uppercase italic drop-shadow-lg truncate mb-1.5">
                                    {team?.robotName || team?.name || 'Unnamed Unit'}
                                </h2>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <div className={`${themeBg}/20 border ${themeBorder}/30 px-3 py-1 backdrop-blur-md rounded-full flex items-center`}>
                                        <span className={`${themeColor} font-black text-[9px] uppercase tracking-widest leading-none`}>
                                            {team?.club || 'Independent'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-full">
                                        <Building2 size={10} className="text-white/60" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none truncate max-w-[120px]">
                                            {team?.university || 'Generic Univ'}
                                        </span>
                                    </div>
                                    {mounted && isActuallyLive && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full backdrop-blur-md">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black text-red-500 uppercase leading-none">Live</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Performance Panel */}
                {mounted && isActuallyLive && liveScore && (
                    <div className={`mx-4 mt-4 p-4 rounded-2xl border ${themeBorder}/30 ${themeBg}/5 animate-pulse`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-[10px] font-black uppercase ${themeColor} tracking-[0.25em] flex items-center gap-2.5`}>
                                <Activity size={12} />
                                Live Telemetry
                            </h3>
                            <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">Realtime</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {liveScore.time !== undefined && (
                                <div className="bg-white/80 p-3 rounded-xl border border-card-border shadow-sm">
                                    <div className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mb-1">Race Time</div>
                                    <div className="text-xl font-black font-mono tracking-tighter text-foreground">
                                        {formatTime(liveScore.time)}
                                    </div>
                                </div>
                            )}

                            {/* Show Points or Other Stats depending on availability */}
                            {(liveScore.knockouts !== undefined || liveScore.juryPoints !== undefined) ? (
                                <div className="bg-white/80 p-3 rounded-xl border border-card-border shadow-sm">
                                    <div className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mb-1">Fight Score</div>
                                    <div className="text-xl font-black font-mono tracking-tighter text-foreground">
                                        {(liveScore.knockouts || 0) * 10 + (liveScore.juryPoints || 0) + (liveScore.damage || 0)} <span className="text-xs text-muted-foreground/60">PTS</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/80 p-3 rounded-xl border border-card-border shadow-sm">
                                    <div className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mb-1">Status</div>
                                    <div className="text-xl font-black font-mono tracking-tighter text-foreground truncate">
                                        {liveScore.completedRoad ? "COMPLETED" : "RUNNING"}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Personnel */}
                <div className={`p-4 md:p-5 bg-gradient-to-b from-transparent to-${baseColor}/5`}>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className={`text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.25em] flex items-center gap-2.5`}>
                            <Users size={12} className={`${themeColor}/60`} />
                            Unit Personnel
                        </h3>
                        <div className="h-px bg-card-border grow mx-4"></div>
                    </div>
                    <div className="space-y-2">
                        {team?.members.map((member, i) => {
                            const isLeader = member.isLeader || member.role === 'Leader';
                            return (
                                <div key={i} className={`flex items-center justify-between p-2 bg-white/50 rounded-2xl border border-card-border group/member hover:bg-white/80 hover:${themeBorder}/20 transition-all duration-300`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-md transition-all ${isLeader ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 border border-yellow-300 scale-110' : `bg-white border border-card-border text-muted-foreground group-hover/member:${themeBorder}/40`}`}>
                                            {isLeader ? <Crown size={14} /> : (member.name.charAt(0) || '?')}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className={`font-black text-[11px] text-foreground/90 group-hover/member:${themeColor} transition-colors tracking-tight uppercase`}>{member.name}</div>
                                            <div className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest">{isLeader ? 'Lead Operator' : 'Unit Member'}</div>
                                        </div>
                                    </div>
                                    {isLeader && (
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-900 bg-yellow-400 px-2.5 py-1 rounded-full border border-yellow-200 shadow-sm">
                                            Leader
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

TeamDetail.displayName = 'TeamDetail';
