"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Users, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

// Shared Components
import { StatsGrid } from '@/components/common/StatsGrid';
import { LiveBadge } from '@/components/common/LiveBadge';

// Utils & Libs
import { getCompetitionState } from '@/lib/competitionState';
import { COMPETITION_CATEGORIES, canonicalizeCompId } from '@/lib/constants';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';
import { CompetitionListItem } from '../../admin/competitions/types';
import { Team } from '@/lib/teams';

export default function CompetitionsPage() {
    const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
    const [compState, setCompState] = useState(getCompetitionState());
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [dbComps, setDbComps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        const [teams, comps, sessions] = await Promise.all([
            fetchTeamsFromSupabase(),
            fetchCompetitionsFromSupabase(),
            fetchLiveSessionsFromSupabase()
        ]);

        setAllTeams(teams);
        setDbComps(comps);
        setCompState(getCompetitionState());

        updateCompetitionState({ liveSessions: sessions }, false);

        // Merge standard categories with DB data
        const mergedComps: CompetitionListItem[] = COMPETITION_CATEGORIES.map(category => {
            const dbMatch = comps.find((c: any) =>
                c.type === category.type ||
                c.name === category.name ||
                c.id === category.id
            );

            return {
                id: dbMatch?.id || category.id,
                title: dbMatch?.name ?? category.name,
                description: `Official ${category.name} tournament.`,
                category: category.type,
                status: dbMatch?.current_phase ?? 'Qualifications',
                totalTeams: dbMatch?.total_teams ?? 0,
                totalMatches: dbMatch?.total_matches ?? 0,
                arena: dbMatch?.arena ?? 'Main Arena',
                schedule: dbMatch?.schedule ?? 'Full Event',
                color: category.color,
                borderColor: category.borderColor
            };
        });

        setCompetitions(mergedComps);
        setLoading(false);
    };

    useEffect(() => {
        refreshData();

        const handleUpdate = () => {
            setCompState(getCompetitionState());
            refreshData();
        };

        window.addEventListener('competition-state-updated', handleUpdate);
        window.addEventListener('competitions-updated', refreshData);
        window.addEventListener('teams-updated', refreshData);
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener('competition-state-updated', handleUpdate);
            window.removeEventListener('competitions-updated', refreshData);
            window.removeEventListener('teams-updated', refreshData);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    useSupabaseRealtime('live_sessions', refreshData);
    useSupabaseRealtime('teams', refreshData);
    useSupabaseRealtime('competitions', refreshData);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                        <LayoutDashboard className="w-8 h-8 text-accent" />
                        Tournament Events
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2">
                        Real-time arena feed and competition schedules
                    </p>
                </div>

                {/* Competition Cards */}
                <div className="space-y-6">
                    {competitions.map((comp, index) => {
                        const liveSess = compState.liveSessions[comp.category];
                        const isActuallyLive = !!liveSess;
                        const displayPhase = isActuallyLive ?
                            (liveSess.phase || comp.status) : comp.status;

                        // Calculate real statistics if available
                        const realTeamsInComp = allTeams.filter(t => {
                            if (!t.competition) return false;

                            // Mandatory: Skip dummy/dead data for accurate stats
                            const isDead = (t.name?.toUpperCase() === 'TEAM-42') ||
                                (t.club?.toUpperCase() === 'CLUB UNKNOWN') ||
                                (!t.name && t.isPlaceholder);
                            if (isDead) return false;

                            const tComp = dbComps.find(c => c.id === t.competition);
                            return (tComp ? tComp.type : t.competition) === comp.category;
                        });

                        const cardStats = [
                            { icon: Users, label: "Teams", value: (comp.totalTeams || realTeamsInComp.length).toString() },
                            { icon: Trophy, label: "Matches", value: (comp.totalMatches || 0).toString() },
                            { icon: MapPin, label: "Arena", value: comp.arena },
                            { icon: Calendar, label: "Schedule", value: comp.schedule }
                        ];

                        return (
                            <Link href={`/competitions/${comp.id}`} key={comp.id} className="block group">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-6 md:p-8 rounded-[2rem] border backdrop-blur-sm transition-all bg-gradient-to-br ${comp.color} ${comp.borderColor} shadow-xl relative overflow-hidden`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-accent transition-colors">
                                                    {comp.title}
                                                </h2>
                                                {isActuallyLive && <LiveBadge />}
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed font-medium opacity-60 max-w-2xl">
                                                {comp.description}
                                            </p>
                                        </div>

                                        <div className="shrink-0">
                                            <div className="px-6 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                                                <span className="font-black text-foreground uppercase text-[11px] tracking-[0.1em] relative z-10">
                                                    {displayPhase}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <StatsGrid stats={cardStats} className="mt-6" />
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
