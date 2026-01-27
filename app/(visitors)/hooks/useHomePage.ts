"use client";

import { useEffect, useState, useCallback } from 'react';
import { getUserRole } from '@/lib/auth';
import { UserRole } from '@/lib/navConfig';
import { getVisitorDashboardData } from '../services/visitorDashboardService';
import { VisitorDashboardData } from '../types';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export function useHomePage() {
    const [role, setRole] = useState<UserRole>('visitor');
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<VisitorDashboardData | null>(null);

    const refreshData = useCallback(() => {
        setData(getVisitorDashboardData());
    }, []);

    useEffect(() => {
        setRole(getUserRole());
        setMounted(true);
        refreshData();

        const handleUpdate = () => refreshData();
        window.addEventListener('competition-state-updated', handleUpdate);
        window.addEventListener('competitions-updated', handleUpdate);
        window.addEventListener('storage', (e) => {
            if (['enstarobots_competition_state_v1', 'enstarobots_competitions_v1', 'admin_dashboard_stats'].includes(e.key || '')) {
                refreshData();
            }
        });

        return () => {
            window.removeEventListener('competition-state-updated', handleUpdate);
            window.removeEventListener('competitions-updated', handleUpdate);
        };
    }, [refreshData]);

    useSupabaseRealtime('live_sessions', refreshData);
    useSupabaseRealtime('competitions', refreshData);
    useSupabaseRealtime('admin_dashboard_stats', refreshData); // If it exists in DB later

    const dashboardHref = role === 'admin' ? '/admin' : role === 'jury' ? '/jury' : '/team';

    return { role, mounted, data, dashboardHref };
}
