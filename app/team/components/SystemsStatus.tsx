"use client";

import { motion } from 'framer-motion';

interface SystemsStatusProps {
    syncPercentage: number;
    statusText: string;
}

export default function SystemsStatus({ syncPercentage, statusText }: SystemsStatusProps) {
    return (
        <div className="bg-gradient-to-br from-role-primary/20 to-role-secondary/10 backdrop-blur-xl border border-role-primary/20 rounded-[2rem] p-6 flex flex-col justify-between h-auto">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-role-primary animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-role-primary">Live Operations</span>
                </div>
                <h4 className="text-base font-black text-foreground uppercase tracking-tight mb-1">Systems Status</h4>
                <p className="text-[10px] text-muted-foreground font-medium mb-6">{statusText}</p>
            </div>
            <div className="space-y-3">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${syncPercentage}%` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="h-full bg-role-primary shadow-[0_0_10px_rgba(var(--color-role-primary-rgb),0.5)]"
                    />
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Global Sync</span>
                    <span className="text-role-primary">{syncPercentage}% Optimized</span>
                </div>
            </div>
        </div>
    );
}
