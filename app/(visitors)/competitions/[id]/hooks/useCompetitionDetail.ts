"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState, getCompetitionState, CompetitionState } from '@/lib/competitionState';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { COMPETITION_CATEGORIES, canonicalizeCompId } from '@/lib/constants';
import { Team } from '@/lib/teams';

export function useCompetitionDetail(compId: string) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [compState, setCompState] = useState<CompetitionState>(getCompetitionState());
    const [loading, setLoading] = useState(true);

    const loadContent = useCallback(async () => {
        try {
            const [dbTeams, dbComps, sessions] = await Promise.all([
                fetchTeamsFromSupabase(),
                fetchCompetitionsFromSupabase(),
                fetchLiveSessionsFromSupabase()
            ]);

            setCompetitions(dbComps);

            // Filter teams for this specific competition
            const resolvedCategory = canonicalizeCompId(compId, dbComps);
            const filteredTeams = dbTeams.filter(t => {
                const tCategory = canonicalizeCompId(t.competition, dbComps);

                // Identify "dead" or incomplete placeholder data (e.g., TEAM-42, UNKNOWN clubs)
                const isDead = (t.name?.toUpperCase() === 'TEAM-42') ||
                    (t.club?.toUpperCase() === 'CLUB UNKNOWN') ||
                    (!t.name && t.isPlaceholder);

                return tCategory === resolvedCategory && !isDead;
            });

            setTeams(filteredTeams);

            updateCompetitionState({ liveSessions: sessions }, false);
            setCompState(getCompetitionState());
        } catch (error) {
            console.error("Error loading competition details:", error);
        } finally {
            setLoading(false);
        }
    }, [compId]);

    useEffect(() => {
        loadContent();

        const handleUpdate = () => setCompState(getCompetitionState());
        window.addEventListener('competition-state-updated', handleUpdate);
        window.addEventListener('competitions-updated', loadContent);
        window.addEventListener('teams-updated', loadContent);

        return () => {
            window.removeEventListener('competition-state-updated', handleUpdate);
            window.removeEventListener('competitions-updated', loadContent);
            window.removeEventListener('teams-updated', loadContent);
        };
    }, [loadContent]);

    useSupabaseRealtime('live_sessions', loadContent);
    useSupabaseRealtime('teams', loadContent);
    useSupabaseRealtime('competitions', loadContent);

    return {
        teams,
        competitions,
        compState,
        loading,
        refresh: loadContent
    };
}
