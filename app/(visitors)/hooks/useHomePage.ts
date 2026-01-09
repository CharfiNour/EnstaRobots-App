"use client";

import { useEffect, useState } from 'react';
import { getUserRole } from '@/lib/auth';
import { UserRole } from '@/lib/navConfig';
import { getVisitorDashboardData } from '../services/visitorDashboardService';
import { VisitorDashboardData } from '../types';

export function useHomePage() {
    const [role, setRole] = useState<UserRole>('visitor');
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<VisitorDashboardData | null>(null);

    useEffect(() => {
        setRole(getUserRole());
        setData(getVisitorDashboardData());
        setMounted(true);
    }, []);

    const dashboardHref = role === 'admin' ? '/admin' : role === 'judge' ? '/judge' : '/team';

    return {
        role,
        mounted,
        data,
        dashboardHref
    };
}
