"use client";

import { motion } from 'framer-motion';
import { Calendar, Clock, Activity, Hash, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TeamInfo {
    id: string;
    name: string;
    order: number;
}

interface ScheduleCardProps {
    startTime: string;
    isLive: boolean;
    currentPhase: string | null;
    teamOrder: number;
    teamName: string;
    myTeamId?: string;
    currentTeam: TeamInfo | null;
    nextTeam: TeamInfo | null;
    nextPhase?: string | null;
}

export default function ScheduleCard({
    startTime,
    isLive,
    currentPhase,
    teamOrder,
    teamName,
    myTeamId,
    currentTeam,
    nextTeam,
    nextPhase
}: ScheduleCardProps) {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        if (isLive) {
            const interval = setInterval(() => setPulse(p => !p), 800);
            return () => clearInterval(interval);
        }
    }, [isLive]);

    const isMyTeamCurrent = currentTeam?.id === myTeamId;
    const isMyTeamNext = nextTeam?.id === myTeamId;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-6"
        >
            {/* Live Competition Status */}
            <div className={`p-6 rounded-[2rem] border transition-all duration-500 flex items-center justify-between ${isLive ? 'bg-role-primary/10 border-role-primary/30 shadow-lg shadow-role-primary/20' : 'bg-card/40 border-card-border'}`}>
                <div className="flex items-center gap-3">
                    <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isLive ? 'bg-role-primary shadow-lg shadow-role-primary/50' : 'bg-muted'}`}>
                        <Zap className={`w-5 h-5 ${isLive ? 'text-white' : 'text-muted-foreground'}`} />
                        {isLive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-ping" />
                        )}
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-role-primary' : 'text-muted-foreground'}`}>System Status</p>
                        <h4 className="text-lg font-black text-foreground uppercase italic leading-tight">{isLive ? 'Live Competition' : 'Standby Mode'}</h4>
                    </div>
                </div>
                {isLive && (
                    <div className="flex-shrink-0 px-3 py-1 bg-role-primary/10 border border-role-primary/30 rounded-lg backdrop-blur-sm">
                        <span className="text-[10px] font-black uppercase text-role-primary tracking-widest whitespace-pre-line text-center block leading-tight">
                            {currentPhase ? `Phase:\n${currentPhase.replace('_', ' ')}` : 'Active'}
                        </span>
                    </div>
                )}
            </div>

            {/* Schedule Info */}
            <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Calendar size={120} className="rotate-12" />
                </div>

                <div className="relative space-y-8">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-role-primary" />
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Temporal Coordinates</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Current Turn</p>
                            <div className="flex items-baseline gap-2">
                                <Hash className="w-5 h-5 text-role-primary" />
                                <p className="text-4xl font-black text-foreground tracking-tighter italic">{currentTeam?.order || '--'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">My Turn</p>
                            <div className="flex items-baseline gap-2">
                                <Hash className="w-5 h-5 text-role-primary" />
                                <p className="text-4xl font-black text-foreground tracking-tighter italic">{teamOrder}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-card-border" />

                    <div className={`space-y-6 transition-all duration-500 ${isLive ? 'opacity-100 scale-100' : 'opacity-20 scale-95 grayscale pointer-events-none'}`}>
                        {/* Current Team Card */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Current Team</h3>
                            </div>
                            <div className={`relative p-4 rounded-2xl border transition-all duration-500 ${isMyTeamCurrent ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/20' : 'bg-muted/20 border-card-border'}`}>
                                {isMyTeamCurrent && (
                                    <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 animate-pulse pointer-events-none" />
                                )}
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isMyTeamCurrent ? 'bg-emerald-500 text-white' : 'bg-black/40 text-muted-foreground'}`}>
                                            {currentTeam?.order || '--'}
                                        </div>
                                        <span className={`text-sm font-black uppercase italic ${isMyTeamCurrent ? 'text-emerald-500' : 'text-foreground'}`}>
                                            {currentTeam?.name || 'Searching...'}
                                        </span>
                                    </div>
                                    {isMyTeamCurrent && <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Active Now</span>}
                                </div>
                            </div>
                        </div>

                        {/* Next Team Card */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-amber-500" />
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Next Team</h3>
                            </div>
                            <div className={`relative p-4 rounded-2xl border transition-all duration-500 ${isMyTeamNext ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/20' : 'bg-muted/20 border-card-border'}`}>
                                {isMyTeamNext && (
                                    <div className="absolute inset-0 rounded-2xl bg-amber-500/5 animate-pulse pointer-events-none" />
                                )}
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isMyTeamNext ? 'bg-amber-500 text-white' : 'bg-black/40 text-muted-foreground'}`}>
                                            {nextTeam?.order || '--'}
                                        </div>
                                        <span className={`text-sm font-black uppercase italic ${isMyTeamNext ? 'text-amber-500' : 'text-foreground'}`}>
                                            {nextTeam?.name || 'Awaiting...'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {nextPhase ? (
                                            <div className="px-3 py-1 rounded-md bg-role-secondary/20 border border-role-secondary/30">
                                                <span className="text-[10px] font-black uppercase text-role-secondary tracking-widest whitespace-nowrap">{nextPhase}</span>
                                            </div>
                                        ) : (
                                            isMyTeamNext && <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Up Next</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
