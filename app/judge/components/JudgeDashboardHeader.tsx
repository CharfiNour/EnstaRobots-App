"use client";

import { motion } from 'framer-motion';
import { Gavel, Activity, ShieldCheck } from 'lucide-react';

interface JudgeDashboardHeaderProps {
    judgeName?: string;
}

export default function JudgeDashboardHeader({ judgeName }: JudgeDashboardHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-role-primary flex items-center justify-center text-white shadow-lg shadow-role-primary/30">
                        <Gavel size={20} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tighter uppercase italic leading-none">
                            Judge Console
                        </h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-role-primary mt-1 pl-0.5">Tactical Oversight</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-0.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-role-primary/10 rounded-lg border border-role-primary/20">
                        <ShieldCheck size={12} className="text-role-primary" />
                        <span className="text-[9px] font-black uppercase text-foreground">{judgeName || 'Official Observer'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-emerald-500">Link: Active</span>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/40 backdrop-blur-xl border border-card-border p-3 px-5 rounded-2xl shadow-xl flex items-center gap-4"
            >
                <div className="flex flex-col items-end">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Status</p>
                    <p className="text-xs font-black text-foreground uppercase italic tracking-tight">On Duty</p>
                </div>
                <div className="w-px h-6 bg-card-border" />
                <div className="w-8 h-8 rounded-full bg-role-primary/10 flex items-center justify-center text-role-primary">
                    <Activity size={16} />
                </div>
            </motion.div>
        </div>
    );
}
