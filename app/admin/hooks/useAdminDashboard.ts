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
        setStats(getAdminStats());
        setActivities(getRecentActivity());
        setLoading(false);
    }, [router]);

    const updateStat = (key: keyof AdminStats, value: string | number) => {
        if (!stats) return;
        const newStats = { ...stats, [key]: value };
        setStats(newStats);
        saveAdminStats(newStats);
    };

    return {
        session,
        loading,
        stats,
        activities,
        router,
        updateStat
    };
}
