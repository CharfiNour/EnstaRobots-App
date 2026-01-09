"use client";

import { motion } from 'framer-motion';
import { Shield, Activity } from 'lucide-react';
import { COMPETITION_CONFIG } from '../services/teamDashboardService';

interface DashboardHeaderProps {
    teamData: any;
    session: any;
}

export default function DashboardHeader({ teamData, session }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div className="flex items-center gap-4 mb-3">
                    <Shield className="w-10 h-10 text-role-primary" />
                    <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none">
                        Team Console
                    </h1>
                </div>
                <div className="flex items-center gap-3 pl-1">
                    <div className="flex items-center gap-2 px-3 py-1 bg-role-primary/10 rounded-lg border border-role-primary/20">
                        <Activity size={14} className="text-role-primary" />
                        <span className="text-[10px] font-black uppercase text-foreground">{teamData?.robotName || teamData?.name || 'My Unit'}</span>
                    </div>
                    {teamData?.competition && (
                        <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${COMPETITION_CONFIG[teamData.competition]?.color || 'bg-role-primary/10 text-role-primary border-role-primary/20'}`}>
                            {COMPETITION_CONFIG[teamData.competition]?.name || teamData.competition.replace(/_/g, ' ')}
                        </div>
                    )}
                    <div className="px-3 py-1 bg-muted/50 rounded-lg border border-card-border text-[10px] font-black text-muted-foreground uppercase">
                        {teamData?.club || 'Standalone'}
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/40 backdrop-blur-xl border border-card-border p-2 pr-8 rounded-[2rem] shadow-xl flex items-center gap-6"
            >
                <div className="p-5 bg-muted/50 rounded-2xl font-mono text-2xl font-black text-role-primary tracking-tighter">
                    {session?.teamCode}
                </div>
                <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-50 mb-1">Access Token</p>
                    <p className="text-sm font-bold text-foreground">Active Node</p>
                </div>
            </motion.div>
        </div>
    );
}
