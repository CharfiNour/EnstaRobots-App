"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState, getCompetitionState, CompetitionState } from '@/lib/competitionState';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { dataCache, cacheKeys } from '@/lib/dataCache';
import { COMPETITION_CATEGORIES, canonicalizeCompId } from '@/lib/constants';
import { Team } from '@/lib/teams';

export function useCompetitionDetail(compId: string) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [compState, setCompState] = useState<CompetitionState>(getCompetitionState());

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydration-safe initial check
        const initialComps = dataCache.get<any[]>(cacheKeys.competitions('full'));
        if (initialComps && initialComps.length > 0) {
            setLoading(false);
        }
    }, []);

    const loadContent = useCallback(async (force: boolean = false) => {
        try {
            // 1. Critical Data (Cached)
            const [dbTeams, dbComps] = await Promise.all([
                fetchTeamsFromSupabase('minimal', force),
                fetchCompetitionsFromSupabase('full', force)
            ]);

            setCompetitions(dbComps);

            // Filter teams for this specific competition
            const resolvedCategory = canonicalizeCompId(compId, dbComps);
            const filteredTeams = dbTeams.filter(t => {
                const tCategory = canonicalizeCompId(t.competition, dbComps);

                // Identify "dead" or incomplete placeholder data
                const isDead = (t.name?.toUpperCase() === 'TEAM-42') ||
                    (t.club?.toUpperCase() === 'CLUB UNKNOWN') ||
                    (!t.name && t.isPlaceholder);

                return tCategory === resolvedCategory && !isDead;
            });

            setTeams(filteredTeams);

            // Unblock UI immediately if we have data
            setLoading(false);

            // 2. Live Data (Background)
            try {
                const sessions = await fetchLiveSessionsFromSupabase();
                updateCompetitionState({ liveSessions: sessions }, { syncRemote: false, suppressEvent: true });
                setCompState(getCompetitionState());
            } catch (e) {
                console.warn("Live session fetch failed", e);
            }
        } catch (error) {
            console.error("Error loading competition details:", error);
            setLoading(false);
        }
    }, [compId]);

    useEffect(() => {
        // SWR Pattern: Instant load + Background Sync
        loadContent(false);
        loadContent(true);

        const handleUpdate = () => setCompState(getCompetitionState());
        window.addEventListener('competition-state-updated', handleUpdate);
        window.addEventListener('competitions-updated', () => loadContent(true));
        window.addEventListener('teams-updated', () => loadContent(true));

        return () => {
            window.removeEventListener('competition-state-updated', handleUpdate);
            window.removeEventListener('competitions-updated', () => loadContent(true));
            window.removeEventListener('teams-updated', () => loadContent(true));
        };
    }, [loadContent]);

    // Optimized Realtime Handler: Only listen to Live Sessions
    const handleLiveUpdate = useCallback(async () => {
        try {
            const sessions = await fetchLiveSessionsFromSupabase();
            // Update local state without triggering global sync or heavy re-fetches
            updateCompetitionState({ liveSessions: sessions }, { syncRemote: false, suppressEvent: true });
            setCompState(getCompetitionState());
        } catch (e) {
            console.warn("Live update failed", e);
        }
    }, []);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedLiveHandler = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // 2-second debounce to group rapid score updates
        debounceRef.current = setTimeout(handleLiveUpdate, 2000);
    }, [handleLiveUpdate]);

    // Only subscribe to the High-Frequency channel for visitors
    useSupabaseRealtime('live_sessions', debouncedLiveHandler);

    return {
        teams,
        competitions,
        compState,
        loading,
        refresh: loadContent
    };
}
