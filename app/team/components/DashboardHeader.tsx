"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity } from 'lucide-react';
import { COMPETITION_CONFIG } from '../services/teamDashboardService';

interface DashboardHeaderProps {
    teamData: any;
    session: any;
}

export default function DashboardHeader({ teamData, session }: DashboardHeaderProps) {
    const [competitionName, setCompetitionName] = useState<string>("");

    useEffect(() => {
        const resolveComp = async () => {
            if (!teamData?.competition) return;

            // Check hardcoded config first (slugs)
            if (COMPETITION_CONFIG[teamData.competition]) {
                setCompetitionName(COMPETITION_CONFIG[teamData.competition].name);
                return;
            }

            // Fallback to DB lookup for UUIDs
            try {
                const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
                const comps = await fetchCompetitionsFromSupabase();
                const match = comps.find((c: any) => c.id === teamData.competition);
                if (match) {
                    setCompetitionName(match.name);
                } else {
                    setCompetitionName(teamData.competition.replace(/_/g, ' '));
                }
            } catch (err) {
                setCompetitionName(teamData.competition.replace(/_/g, ' '));
            }
        };
        resolveComp();
    }, [teamData]);

    const compColor = teamData?.competition && COMPETITION_CONFIG[teamData.competition]
        ? COMPETITION_CONFIG[teamData.competition].color
        : 'bg-role-primary/10 text-role-primary border-role-primary/20';

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
                        <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${compColor}`}>
                            {competitionName || (COMPETITION_CONFIG[teamData.competition]?.name || teamData.competition.replace(/_/g, ' '))}
                        </div>
                    )}
                    <div className="px-3 py-1 bg-muted/50 rounded-lg border border-card-border text-[10px] font-black text-muted-foreground uppercase">
                        {teamData?.club || 'Standalone'}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
