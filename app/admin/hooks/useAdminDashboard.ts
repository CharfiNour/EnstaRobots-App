"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAdminStats, getRecentActivity, saveAdminStats } from '../services/dashboardService';
import { AdminStats, ActivityItemData } from '../types';

export function useAdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [activities, setActivities] = useState<ActivityItemData[]>([]);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'admin') {
            router.push('/auth/jury');
            return;
        }
        setSession(currentSession);

        const loadDashboard = async () => {
            const fetchedStats = await getAdminStats();
            const fetchedActivities = getRecentActivity();

            setStats(fetchedStats);
            setActivities(fetchedActivities);
            setLoading(false);
        };
        loadDashboard();
    }, [router]);

    /**
     * Local update for immediate UI feedback
     */
    const updateStat = (key: keyof AdminStats, value: string | number) => {
        if (!stats) return;
        setStats({ ...stats, [key]: value });
    };

    /**
     * Remote save for persistence
     */
    const persistStats = async () => {
        if (!stats) return;
        console.log('[DASHBOARD] Persisting stats to DB...', stats);
        await saveAdminStats(stats);
    };

    return {
        session,
        loading,
        stats,
        activities,
        router,
        updateStat,
        persistStats
    };
}
