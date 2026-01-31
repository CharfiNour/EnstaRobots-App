"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { fetchTeamsFromSupabase, fetchLiveSessionsFromSupabase, fetchCompetitionsFromSupabase, fetchScoresFromSupabase } from '@/lib/supabaseData';
import { canonicalizeCompId } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { getCompetitionState, CompetitionState } from '@/lib/competitionState';
import { Team, Competition } from '@/lib/teams';

export function useTeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [teamData, setTeamData] = useState<any>(null);
    const [compState, setCompState] = useState<CompetitionState | null>(null);

    // New club-centric live status
    const [clubLiveStatus, setClubLiveStatus] = useState<{
        hasLiveTeam: boolean;
        activeTeam?: any; // The club's team currently in/queued for a live comp
        currentTurn?: number | null;
        myTurn?: number;
        phase?: string | null;
        competitionName?: string;
    }>({ hasLiveTeam: false });

    const router = useRouter();

    const fetchDashboardData = async () => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);

        const [teams, liveSessions, competitions, allScores, freshCompState] = await Promise.all([
            fetchTeamsFromSupabase('minimal'),
            fetchLiveSessionsFromSupabase(),
            fetchCompetitionsFromSupabase(),
            fetchScoresFromSupabase(),
            getCompetitionState()
        ]);

        setCompState(freshCompState);

        const clubName = currentSession.clubName || teams.find(t => t.id === currentSession.teamId)?.club;
        const myTeams = teams.filter(t => t.club === clubName);

        // Primary team for the profile (the one they logged in as or first in list)
        const primaryTeam = teams.find(t => t.id === currentSession.teamId) || myTeams[0];

        if (primaryTeam) {
            setTeamData(primaryTeam);
            const hasCompletedUnit = myTeams.some(t => !t.isPlaceholder);
            setProfileComplete(hasCompletedUnit);

            // Look for ANY live competition that a club team is part of
            let liveEntry = null;

            for (const team of myTeams) {
                const canonCompId = canonicalizeCompId(team.competition, competitions);
                const sessionInfo = liveSessions[canonCompId];

                // Even if not live, we check if the competition is "Started"
                const relevantComp = competitions.find(c => canonicalizeCompId(c.id, competitions) === canonCompId);
                const activePhase = relevantComp?.current_phase || 'qualifications';

                const isValidPhase = activePhase &&
                    activePhase !== 'upcoming' &&
                    activePhase !== 'Not Started' &&
                    !activePhase.includes('Completed');

                if (sessionInfo || isValidPhase) {
                    // This competition is active. Let's calculate turns.
                    const compTeams = teams.filter(t => canonicalizeCompId(t.competition, competitions) === canonCompId);

                    // Is this a draw-based competition? (Logic synchronized with useMatchesPage)
                    const isDrawBased = ['all_terrain', 'junior_all_terrain', 'line_follower', 'junior_line_follower'].includes(canonCompId);

                    let myTurn = 0;
                    let currentTurn = null;

                    if (isDrawBased) {
                        // Find pending scores for this phase to identify groups
                        const phaseMatches = allScores.filter(s =>
                            s.competitionType === canonCompId &&
                            s.phase === activePhase &&
                            s.status === 'pending'
                        );

                        // Group scores by matchId
                        const matches: Record<string, string[]> = {};
                        phaseMatches.forEach(s => {
                            if (!matches[s.matchId]) matches[s.matchId] = [];
                            matches[s.matchId].push(s.teamId);
                        });

                        // Unique Match IDs in order
                        const orderedMatchIds = Array.from(new Set(phaseMatches.map(s => s.matchId)));

                        // Find which match this team belongs to
                        const myMatchId = Object.keys(matches).find(mId => matches[mId].includes(team.id));
                        const matchIndex = myMatchId ? orderedMatchIds.indexOf(myMatchId) : -1;

                        // If matchIndex is -1, it means draw hasn't happened -> turn is 0 (displayed as --)
                        myTurn = matchIndex !== -1 ? matchIndex + 1 : 0;

                        if (sessionInfo) {
                            const activeMatchId = Object.keys(matches).find(mId => matches[mId].includes(sessionInfo.teamId));
                            const activeMatchIndex = activeMatchId ? orderedMatchIds.indexOf(activeMatchId) : -1;
                            currentTurn = activeMatchIndex !== -1 ? activeMatchIndex + 1 : null;
                        }
                    } else {
                        // Line Follower style: Incremental indexing
                        const myIdx = compTeams.findIndex(t => t.id === team.id);
                        myTurn = myIdx !== -1 ? myIdx + 1 : 0;

                        if (sessionInfo) {
                            const activeIdx = compTeams.findIndex(t => t.id === sessionInfo.teamId);
                            currentTurn = activeIdx !== -1 ? activeIdx + 1 : null;
                        }
                    }

                    liveEntry = {
                        hasLiveTeam: true,
                        activeTeam: team,
                        myTurn,
                        currentTurn,
                        phase: sessionInfo?.phase || activePhase,
                        competitionName: relevantComp?.name || team.competition
                    };
                    break;
                }
            }

            if (liveEntry) {
                setClubLiveStatus(liveEntry);
            } else {
                setClubLiveStatus({ hasLiveTeam: false });
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchDashboardData();

        window.addEventListener('competition-state-updated', fetchDashboardData);
        const channel = supabase
            .channel(`dashboard_realtime_${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, fetchDashboardData)
            .subscribe();

        return () => {
            window.removeEventListener('competition-state-updated', fetchDashboardData);
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        session,
        loading,
        profileComplete,
        teamData,
        ...clubLiveStatus,
        compState,
        router
    };
}
