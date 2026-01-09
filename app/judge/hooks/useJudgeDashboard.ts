"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getJudgeDashboardData } from '../services/judgeDashboardService';
import { JudgeDashboardData } from '../types';

export function useJudgeDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<JudgeDashboardData | null>(null);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'judge') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setData(getJudgeDashboardData());
        setLoading(false);
    }, [router]);

    return {
        session,
        loading,
        data,
        router
    };
}
