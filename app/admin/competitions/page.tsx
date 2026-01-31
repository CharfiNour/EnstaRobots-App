"use client";

import { useEffect, useState } from 'react';
import { Plus, LayoutDashboard } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Local imports
import { CompetitionCard } from './components';
import { getAdminCompetitions, saveAdminCompetitions } from './services/competitionService';
import { CompetitionListItem } from './types';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';

export default function CompetitionsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || (currentSession.role !== 'admin' && currentSession.role !== 'jury')) {
            router.push('/auth/jury');
            return;
        }
        setSession(currentSession);
        setCompetitions(getAdminCompetitions());
        setLoading(false);

        // Initial fetch from DB and proactive sync
        const syncAndLoad = async () => {
            const { fetchLiveSessionsFromSupabase, fetchCompetitionsFromSupabase, updateCompetitionToSupabase } = await import('@/lib/supabaseData');

            const [sessions, comps] = await Promise.all([
                fetchLiveSessionsFromSupabase(),
                fetchCompetitionsFromSupabase()
            ]);

            if (sessions && Object.keys(sessions).length > 0) {
                updateCompetitionState({ liveSessions: sessions });
            }

            // If some competitions are missing in DB, push them now
            const local = getAdminCompetitions();
            for (const lc of local) {
                const dbMatch = comps.find((dc: any) => dc.type === lc.category);
                if (!dbMatch) {
                    console.log(`Proactively syncing missing category to cloud: ${lc.category}`);
                    await updateCompetitionToSupabase(lc.id, {
                        name: lc.title,
                        current_phase: lc.status,
                        total_matches: lc.totalMatches,
                        total_teams: lc.totalTeams,
                        arena: lc.arena,
                        schedule: lc.schedule
                    });
                }
            }

            // Re-fetch after sync to ensure local state matches cloud
            const finalComps = await fetchCompetitionsFromSupabase();
            handleRealtimeUpdate();
        };

        syncAndLoad();
    }, [router]);

    const handleRealtimeUpdate = async () => {
        const { fetchLiveSessionsFromSupabase, fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
        const [sessions, comps] = await Promise.all([
            fetchLiveSessionsFromSupabase(true),
            fetchCompetitionsFromSupabase()
        ]);
        if (sessions) {
            updateCompetitionState({ liveSessions: sessions }, false);
        }

        // Update local competitions list from DB if we want to sync with other admins
        const localComps = getAdminCompetitions();
        const updatedComps = localComps.map(lc => {
            const dbMatch = comps.find((dc: any) => dc.type === lc.category);
            if (dbMatch) {
                return {
                    ...lc,
                    id: dbMatch.id || lc.id,
                    title: dbMatch.name ?? lc.title,
                    status: dbMatch.current_phase ?? lc.status,
                    totalMatches: dbMatch.total_matches ?? lc.totalMatches,
                    totalTeams: dbMatch.total_teams ?? lc.totalTeams,
                    arena: dbMatch.arena ?? lc.arena,
                    schedule: dbMatch.schedule ?? lc.schedule
                };
            }
            return lc;
        });
        setCompetitions(updatedComps);
        saveAdminCompetitions(updatedComps);
    };

    useSupabaseRealtime('live_sessions', handleRealtimeUpdate);
    useSupabaseRealtime('competitions', handleRealtimeUpdate);

    const handleUpdate = async (updated: CompetitionListItem) => {
        // 1. Update local UI state
        setCompetitions(prev => prev.map(c => c.id === updated.id ? updated : c));

        // 2. Persist to memory and trigger dispatch
        const currentComps = getAdminCompetitions();
        const nextComps = currentComps.map(c => c.id === updated.id ? updated : c);
        saveAdminCompetitions(nextComps);

        // Persist to Supabase
        const { updateCompetitionToSupabase } = await import('@/lib/supabaseData');
        updateCompetitionToSupabase(updated.id, {
            name: updated.title,
            current_phase: updated.status,
            total_matches: updated.totalMatches,
            total_teams: updated.totalTeams,
            arena: updated.arena,
            schedule: updated.schedule
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-12">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                        <LayoutDashboard className="w-8 h-8 text-accent" />
                        Tournament Console
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2">
                        Centralized logistics and live synchronization
                    </p>
                </div>

                <div className="space-y-6">
                    {competitions.map((comp, index) => (
                        <CompetitionCard
                            key={comp.id}
                            comp={comp}
                            index={index}
                            onUpdate={handleUpdate}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
