"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAdminStats, getRecentActivity } from '../services/dashboardService';
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
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setStats(getAdminStats());
        setActivities(getRecentActivity());
        setLoading(false);
    }, [router]);

    return {
        session,
        loading,
        stats,
        activities,
        router
    };
}
