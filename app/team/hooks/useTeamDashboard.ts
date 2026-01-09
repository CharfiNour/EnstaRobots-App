"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTeams } from '@/lib/teams';
import { getTeamDashboardData } from '../services/teamDashboardService';
import { TeamDashboardData } from '../types';

export function useTeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [teamData, setTeamData] = useState<any>(null);
    const [data, setData] = useState<TeamDashboardData | null>(null);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);

        const teams = getTeams();
        const team = teams.find(t => t.id === currentSession.teamId);

        if (team) {
            setTeamData(team);
            setProfileComplete(!team.isPlaceholder);
        }

        setData(getTeamDashboardData());
        setLoading(false);
    }, [router]);

    return {
        session,
        loading,
        profileComplete,
        teamData,
        data,
        router
    };
}
