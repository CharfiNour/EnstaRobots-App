"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { fetchTeamsFromSupabase, fetchLiveSessionsFromSupabase, fetchCompetitionsFromSupabase } from '@/lib/supabaseData';
import { supabase } from '@/lib/supabase';

export function useTeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [teamData, setTeamData] = useState<any>(null);
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

            const [teams, liveSessions, competitions] = await Promise.all([
                fetchTeamsFromSupabase('minimal'),
                fetchLiveSessionsFromSupabase(),
                fetchCompetitionsFromSupabase()
            ]);

            if (!isMounted) return;

            const team = teams.find(t => t.id === currentSession.teamId);

            if (team) {
                const compTeams = teams.filter(t => t.competition === team.competition);
                const teamIndex = compTeams.findIndex(t => t.id === team.id);
                const teamWithOrder = { ...team, order: teamIndex + 1 };

                setTeamData(teamWithOrder);
                setProfileComplete(!team.isPlaceholder);

                // Real-time Competition Logic
                let isLive = false;
                let currentT = null;
                let nextT = null;
                let phase = null;

                // Robust lookup: Resolve team.competition (which could be UUID or slug) to the actual DB UUID
                const relevantComp = competitions.find((c: any) => c.id === team.competition || c.type === team.competition);

                const sessionInfo = (relevantComp?.id && liveSessions[relevantComp.id])
                    || (relevantComp?.type && liveSessions[relevantComp.type])
                    || (team.competition && liveSessions[team.competition]);

                if (sessionInfo) {
                    isLive = true;
                    phase = sessionInfo.phase;

                    const activeTeamId = sessionInfo.teamId;
                    const activeTeam = teams.find(t => t.id === activeTeamId);

                    if (activeTeam) {
                        const currentIdx = compTeams.findIndex(t => t.id === activeTeamId);
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
        router
    };
}
