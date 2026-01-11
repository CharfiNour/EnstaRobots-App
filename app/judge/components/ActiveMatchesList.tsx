"use client";

import { motion } from 'framer-motion';
import { Trophy, Activity, Zap } from 'lucide-react';
import { JudgeDashboardData } from '../types';

interface ActiveMatchesListProps {
    matches: JudgeDashboardData['activeMatches'];
}

export default function ActiveMatchesList({ matches }: ActiveMatchesListProps) {
    return (
        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] p-6 h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-role-primary/10 text-role-primary flex items-center justify-center relative">
                        <Trophy size={18} />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-role-primary rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight italic">Arena Feed</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-role-primary animate-ping" />
                            <p className="text-[9px] text-role-primary font-black uppercase tracking-widest opacity-80">Live Matches</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                {matches.length === 0 ? (
                    <div className="text-center py-6 opacity-30 flex flex-col items-center">
                        <Zap size={36} className="text-muted-foreground mb-3" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">No Active Signals</h4>
                        <p className="text-[9px] font-bold uppercase tracking-tight max-w-[180px] leading-relaxed text-center">Waiting for headquarters to initiate new competition sessions.</p>
                    </div>
                ) : (
                    <div className="w-full space-y-3">
                        {/* Render active matches here if data existed */}
                    </div>
                )}
            </div>
        </div>
    );
}
