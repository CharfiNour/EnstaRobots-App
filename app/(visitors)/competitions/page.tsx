"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Users, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

// Shared Components
import { StatsGrid } from '@/components/common/StatsGrid';
import { LiveBadge } from '@/components/common/LiveBadge';

// Utils & Libs
import { getCompetitionState } from '@/lib/competitionState';
import { COMPETITION_CATEGORIES } from '@/lib/constants';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';
import { CompetitionListItem } from '../../admin/competitions/types';
import { Team } from '@/lib/teams';
import { dataCache, cacheKeys } from '@/lib/dataCache';

// Memoized Card Component to prevent re-render storms
const CompetitionCard = React.memo(({ comp, compState, allTeams, dbComps }: any) => {
    const liveSess = compState.liveSessions[comp.category];
    const isActuallyLive = !!liveSess;
    const displayPhase = isActuallyLive ? (liveSess.phase || comp.status) : comp.status;

    // Memoize stats calculation per card
    const cardStats = useMemo(() => {
        const realTeamsInComp = allTeams.filter((t: any) => {
            if (!t.competition) return false;
            const isDead = (t.name?.toUpperCase() === 'TEAM-42') ||
                (t.club?.toUpperCase() === 'CLUB UNKNOWN') ||
                (!t.name && t.isPlaceholder);
            if (isDead) return false;

            const tComp = dbComps.find((c: any) => c.id === t.competition);
            return (tComp ? tComp.type : t.competition) === comp.category;
        });

        return [
            { icon: Users, label: "Teams", value: (comp.totalTeams || realTeamsInComp.length).toString() },
            { icon: Trophy, label: "Matches", value: (comp.totalMatches || 0).toString() },
            { icon: MapPin, label: "Arena", value: comp.arena },
            { icon: Calendar, label: "Schedule", value: comp.schedule }
        ];
    }, [comp, allTeams, dbComps]);

    return (
        <Link href={`/competitions/${comp.id}`} className="block group">
            <motion.div
                initial={false} // Disable entry animations for better performance
                whileHover={{ y: -2 }}
                className={`p-6 md:p-8 rounded-[2rem] border transition-all bg-gradient-to-br ${comp.color} ${comp.borderColor} shadow-lg relative overflow-hidden`}
            >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-accent transition-colors">
                                {comp.title}
                            </h2>
                            {isActuallyLive && <LiveBadge />}
                        </div>
                        <p className="text-muted-foreground leading-relaxed font-medium opacity-70 max-w-2xl text-sm">
                            {comp.description}
                        </p>
                    </div>

                    <div className="shrink-0">
                        <div className="px-5 py-2 bg-white/10 rounded-2xl border border-white/10">
                            <span className="font-black text-foreground uppercase text-[10px] tracking-[0.1em] relative z-10">
                                {displayPhase}
                            </span>
                        </div>
                    </div>
                </div>

                <StatsGrid stats={cardStats} className="mt-6" />
            </motion.div>
        </Link>
    );
});

CompetitionCard.displayName = 'CompetitionCard';

export default function CompetitionsPage() {
    // Optimistic initial values from cache
    const initialTeams = useMemo(() => dataCache.get<Team[]>(cacheKeys.teams('minimal')) || [], []);
    const initialComps = useMemo(() => dataCache.get<any[]>(cacheKeys.competitions('minimal')) || [], []);

    const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
    const [compState, setCompState] = useState(getCompetitionState());
    const [allTeams, setAllTeams] = useState<Team[]>(initialTeams);
    const [dbComps, setDbComps] = useState<any[]>(initialComps);

    // UI rule: only show spinner if NO data exists at all
    const [loading, setLoading] = useState(initialComps.length === 0);

    const refreshData = useCallback(async (force: boolean = false) => {
        // 1. Critical Data (Teams & Competitions) - Minimized payload
        const [teams, comps] = await Promise.all([
            fetchTeamsFromSupabase('minimal', force),
            fetchCompetitionsFromSupabase('minimal', force)
        ]);

        setAllTeams(teams);
        setDbComps(comps);

        // Merge logic
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

        // 2. Live Data (Background)
        try {
            const sessions = await fetchLiveSessionsFromSupabase();
            updateCompetitionState({ liveSessions: sessions }, { syncRemote: false, suppressEvent: true });
            setCompState(getCompetitionState());
        } catch (e) {
            console.warn("Live sync failed", e);
        }
    }, []);

    // Optimized Live Update for high-frequency events
    const handleLiveUpdate = useCallback(async () => {
        try {
            // Only fetch the tiny live_sessions delta
            const sessions = await fetchLiveSessionsFromSupabase();
            updateCompetitionState({ liveSessions: sessions }, { syncRemote: false, suppressEvent: true });
            setCompState(getCompetitionState());
        } catch (e) {
            console.warn("Live update failed", e);
        }
    }, []);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedLiveHandler = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(handleLiveUpdate, 1500);
    }, [handleLiveUpdate]);

    useEffect(() => {
        refreshData(false);
        refreshData(true);

        const handleUpdate = () => {
            setCompState(getCompetitionState());
            refreshData(false);
        };

        window.addEventListener('competition-state-updated', handleUpdate);
        window.addEventListener('competitions-updated', () => refreshData(true));
        window.addEventListener('teams-updated', () => refreshData(true));
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener('competition-state-updated', handleUpdate);
            window.removeEventListener('competitions-updated', () => refreshData(true));
            window.removeEventListener('teams-updated', () => refreshData(true));
            window.removeEventListener('storage', handleUpdate);
        };
    }, [refreshData]);

    useSupabaseRealtime('live_sessions', debouncedLiveHandler);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin grayscale opacity-30"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-10">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                        <LayoutDashboard className="w-8 h-8 text-accent shrink-0" />
                        Tournament Events
                    </h1>
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 mt-2">
                        Real-time arena feed • Secure protocol active
                    </p>
                </div>

                <div className="grid gap-6">
                    {competitions.map((comp, index) => (
                        <CompetitionCard
                            key={comp.id}
                            comp={comp}
                            index={index}
                            compState={compState}
                            allTeams={allTeams}
                            dbComps={dbComps}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
