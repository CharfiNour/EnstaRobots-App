"use client";

import { motion } from 'framer-motion';
import { Target, Shield } from 'lucide-react';

interface MatchesHeaderProps {
    competitionName: string;
    teamName: string;
}

export default function MatchesHeader({ competitionName, teamName }: MatchesHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10"
        >
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-2xl shadow-role-primary/40 ring-1 ring-white/20">
                    <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic leading-none mb-2">
                        Tactical Briefing
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                        <Shield size={14} className="text-role-primary" />
                        Competition Directives & Intel
                    </p>
                </div>
            </div>

        </motion.div>
    );
}
