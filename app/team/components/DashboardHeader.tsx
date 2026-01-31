"use client";

import { motion } from 'framer-motion';
import { Shield, Activity, Landmark } from 'lucide-react';

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
                    {/* Unit Badge */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-lg border border-card-border">
                        <Activity size={14} className="text-muted-foreground opacity-60" />
                        <span className="text-[10px] font-black uppercase text-foreground">{teamData?.robotName || teamData?.name || 'My Unit'}</span>
                    </div>

                    {/* Club Badge (Now Blue/Primary Styled) */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-role-primary/10 rounded-lg border border-role-primary/20 text-[10px] font-black text-role-primary uppercase tracking-wider">
                        <Landmark size={12} />
                        {teamData?.club || 'Standalone'}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
