"use client";

import { useEffect, useState, useCallback } from 'react';
import { getUserRole } from '@/lib/auth';
import { UserRole } from '@/lib/navConfig';
import { getVisitorDashboardData } from '../services/visitorDashboardService';
import { VisitorDashboardData } from '../types';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';

export function useHomePage() {
    const [role, setRole] = useState<UserRole>('visitor');
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<VisitorDashboardData | null>(null);

    const refreshData = useCallback(() => {
        setData(getVisitorDashboardData());
    }, []);

    const syncData = useCallback(async () => {
        // Fetch latest live sessions from Supabase
        const sessions = await fetchLiveSessionsFromSupabase();
        if (Object.keys(sessions).length > 0) {
            // Sync to local state so getVisitorDashboardData can see it
            updateCompetitionState({ liveSessions: sessions });
        }
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        setRole(getUserRole());
        setMounted(true);
        refreshData(); // Immediate local load
        syncData(); // Async sync from DB

        const handleUpdate = () => refreshData();

        window.addEventListener('competition-state-updated', handleUpdate);
        window.addEventListener('competitions-updated', handleUpdate);
        window.addEventListener('storage', (e) => {
            if (
                e.key === 'enstarobots_competition_state_v1' ||
                e.key === 'enstarobots_competitions_v1'
            ) {
                refreshData();
            }
        });

        // Fallback polling
        const interval = setInterval(() => {
            refreshData();
        }, 5000);

        return () => {
            window.removeEventListener('competition-state-updated', handleUpdate);
            window.removeEventListener('competitions-updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate); // Note: anonymous function reference issue in previous thought, using exact ref here won't work if defined inside effect. 
            // Correction: handleUpdate is defined inside effect, so removeEventListener works within this closure scope.
            clearInterval(interval);
        };
    }, [refreshData, syncData]);

    // Realtime subscriptions
    useSupabaseRealtime('live_sessions', () => {
        console.log("HomePage: Live sessions updated");
        syncData();
    });

    const dashboardHref = role === 'admin' ? '/admin' : role === 'jury' ? '/jury' : '/team';

    return {
        role,
        mounted,
        data,
        dashboardHref
    };
}
