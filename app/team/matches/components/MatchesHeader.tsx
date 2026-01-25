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
            <div className="flex items-center gap-3">
                <div className="w-15 h-15 rounded-xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-xl shadow-role-primary/20 ring-1 ring-white/10">
                    <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none mb-2">
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
