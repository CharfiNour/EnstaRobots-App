"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getJuryDashboardData } from '../services/juryDashboardService';
import { JuryDashboardData } from '../types';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';

export function useJuryDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<JuryDashboardData | null>(null);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || (currentSession.role !== 'jury' && currentSession.role !== 'homologation_jury')) {
            router.push('/auth/jury');
            return;
        }
        setSession(currentSession);
        setData(getJuryDashboardData());
        setLoading(false);
    }, [router]);

    const handleRealtimeUpdate = async () => {
        const sessions = await fetchLiveSessionsFromSupabase();
        if (sessions) {
            updateCompetitionState({ liveSessions: sessions }, false);
        }
    };

    useSupabaseRealtime('live_sessions', handleRealtimeUpdate);

    return {
        session,
        loading,
        data,
        router
    };
}
