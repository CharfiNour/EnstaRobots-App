"use client";

import { motion } from 'framer-motion';
import { Shield, Activity, ShieldCheck } from 'lucide-react';

interface JuryDashboardHeaderProps {
    judgeName?: string;
    competitionId?: string;
    role?: string;
}

import { COMPETITION_CATEGORIES, canonicalizeCompId } from '@/lib/constants';

export default function JuryDashboardHeader({ judgeName, competitionId, role }: JuryDashboardHeaderProps) {
    const canonicalId = canonicalizeCompId(competitionId);
    const category = COMPETITION_CATEGORIES.find(c => c.type === canonicalId);

    const roleLabel = role === 'homologation_jury' ? 'Homologation Jury' : 'Official Observer';
    const roleColor = role === 'homologation_jury' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-role-primary/10 text-muted-foreground border-role-primary/20';

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center text-white shadow-2xl shadow-role-primary/40 ring-1 ring-white/20">
                        <Shield size={25} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tighter uppercase italic leading-none">
                            Jury Console
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-0.5">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm ${roleColor}`}>
                        <ShieldCheck size={14} className={role === 'homologation_jury' ? 'text-purple-500' : 'text-role-primary'} />
                        <span className="text-[11px] font-black uppercase">{judgeName || roleLabel}</span>
                    </div>

                    {category && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm ${category.badgeColor}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-50" />
                            <span className="text-[11px] font-black uppercase">{category.name}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase text-emerald-500">Link: Active</span>
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
