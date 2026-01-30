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
    const [competitionStatus, setCompetitionStatus] = useState({
        isLive: false,
        currentTeam: null as any,
        nextTeam: null as any,
        currentPhase: null as string | null
    });

    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            const currentSession = getSession();
            if (!currentSession || currentSession.role !== 'team') {
                router.push('/auth/team');
                return;
            }
            if (isMounted) setSession(currentSession);

            const [teams, liveSessions, competitions, allScores, freshCompState] = await Promise.all([
                fetchTeamsFromSupabase('minimal'),
                fetchLiveSessionsFromSupabase(),
                fetchCompetitionsFromSupabase(),
                fetchScoresFromSupabase(),
                getCompetitionState()
            ]);

            if (!isMounted) return;

            setCompState(freshCompState);
            const team = teams.find((t: any) => t.id === currentSession.teamId);

            if (team) {
                // Determine relevant competition
                const relevantComp = competitions.find((c: Competition) => c.id === team.competition || c.type === team.competition);
                const activePhase = relevantComp?.current_phase;
                const canonicalMyComp = canonicalizeCompId(team.competition, competitions);

                // Check for live session in my competition
                const safeSessions = liveSessions || {};
                const sessionInfo = (relevantComp?.id && safeSessions[relevantComp.id])
                    || (relevantComp?.type && safeSessions[relevantComp.type])
                    || (team.competition && safeSessions[team.competition]);

                // A phase is officially "Drawn" or "Started" if:
                // 1. There is an active live session
                // 2. OR there are scores recorded for the active phase
                // 3. AND the active phase is not "upcoming" or "completed"
                const isValidPhase = activePhase &&
                    activePhase !== 'upcoming' &&
                    activePhase !== 'Not Started' &&
                    !activePhase.includes('Completed');

                const hasScoresForPhase = isValidPhase && allScores.some((s: any) => {
                    const sComp = canonicalizeCompId(s.competitionType || s.competitionId, competitions);
                    const sPhase = String(s.phase).toLowerCase();
                    const targetPhase = String(activePhase).toLowerCase();

                    return sComp === canonicalMyComp &&
                        (sPhase === targetPhase || (sPhase === 'essay 1' && targetPhase === 'essay 1') || (sPhase === 'essay 2' && targetPhase === 'essay 2'));
                });

                const isDrawn = !!sessionInfo || hasScoresForPhase;

                // Filter teams for this competition
                const compTeams = teams.filter((t: any) => canonicalizeCompId(t.competition, competitions) === canonicalMyComp);

                // Calculate order
                let teamOrder = null;
                if (isDrawn) {
                    const teamIndex = compTeams.findIndex((t: any) => t.id === team.id);
                    teamOrder = teamIndex !== -1 ? teamIndex + 1 : null;
                }

                const teamWithOrder = { ...team, order: teamOrder };

                setTeamData(teamWithOrder);
                setProfileComplete(!team.isPlaceholder);

                // Real-time Competition Logic
                let isLive = false;
                let currentT = null;
                let nextT = null;
                let phase = null;

                if (sessionInfo) {
                    isLive = true;
                    phase = sessionInfo.phase;

                    const activeTeamId = sessionInfo.teamId;
                    const activeTeam = teams.find((t: any) => t.id === activeTeamId);

                    if (activeTeam) {
                        const currentIdx = compTeams.findIndex((t: any) => t.id === activeTeamId);
                        if (currentIdx !== -1) {
                            currentT = { ...activeTeam, order: currentIdx + 1 };
                            const nextIdx = (currentIdx + 1) % compTeams.length;
                            nextT = { ...compTeams[nextIdx], order: nextIdx + 1 };
                        }
                    }
                }

                setCompetitionStatus({
                    isLive,
                    currentTeam: currentT,
                    nextTeam: nextT,
                    currentPhase: phase
                });
            }

            setLoading(false);
        };

        fetchDashboardData();

        // 1. Listen for Local Events
        const handleLocalUpdate = () => {
            console.log('🔄 Dashboard: Local update event received');
            fetchDashboardData();
        };
        window.addEventListener('competition-state-updated', handleLocalUpdate);

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`dashboard_live_tracker_${Math.random()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'live_sessions' },
                () => {
                    console.log('⚡ Dashboard: Realtime Update Received');
                    fetchDashboardData();
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            window.removeEventListener('competition-state-updated', handleLocalUpdate);
            supabase.removeChannel(channel);
        };
    }, [router]);

    return {
        session,
        loading,
        profileComplete,
        teamData,
        ...competitionStatus,
        compState,
        router
    };
}
