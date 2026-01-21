"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { fetchTeamsFromSupabase, fetchLiveSessionsFromSupabase } from '@/lib/supabaseData';
import { getTeamDashboardData } from '../services/teamDashboardService';
import { TeamDashboardData } from '../types';

export function useTeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [teamData, setTeamData] = useState<any>(null);
    const [data, setData] = useState<TeamDashboardData | null>(null);
    const [competitionStatus, setCompetitionStatus] = useState({
        isLive: false,
        currentTeam: null as any,
        nextTeam: null as any,
        currentPhase: null as string | null
    });

    const router = useRouter();

    useEffect(() => {
        const fetchDashboardData = async () => {
            const currentSession = getSession();
            if (!currentSession || currentSession.role !== 'team') {
                router.push('/auth/team');
                return;
            }
            setSession(currentSession);

            const teams = await fetchTeamsFromSupabase();
            const liveSessions = await fetchLiveSessionsFromSupabase();
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

                if (team.competition && liveSessions?.[team.competition]) {
                    const sessionInfo = liveSessions[team.competition];
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

            setData(getTeamDashboardData());
            setLoading(false);
        };

        fetchDashboardData();

        window.addEventListener('competition-state-updated', fetchDashboardData);
        return () => window.removeEventListener('competition-state-updated', fetchDashboardData);
    }, [router]);

    return {
        session,
        loading,
        profileComplete,
        teamData,
        data,
        ...competitionStatus,
        router
    };
}
