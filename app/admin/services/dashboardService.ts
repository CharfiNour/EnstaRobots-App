import { Trophy, Users, Calendar, Bell } from 'lucide-react';
import { AdminStats, ActivityItemData } from '../types';

const STORAGE_KEY = 'admin_dashboard_stats';

const DEFAULT_STATS: AdminStats = {
    totalCompetitions: 5,
    totalTeams: 48,
    totalMatches: 156,
    liveMatches: 2,
    upcomingMatches: 12,
    pendingScores: 3,
    eventDuration: "3 Days",
};

export const getAdminStats = (): AdminStats => {
    if (typeof window === 'undefined') return DEFAULT_STATS;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return DEFAULT_STATS;
};

export const saveAdminStats = (stats: AdminStats): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
};

export const getRecentActivity = (): ActivityItemData[] => {
    return [
        {
            icon: Trophy,
            text: "Competition 'Fight' status changed to Finals",
            time: "5 minutes ago"
        },
        {
            icon: Users,
            text: "New team 'RoboWarriors' added to All Terrain",
            time: "12 minutes ago"
        },
        {
            icon: Calendar,
            text: "Match scheduled: Arena 1 at 14:30",
            time: "1 hour ago"
        },
        {
            icon: Bell,
            text: "Announcement published to all teams",
            time: "2 hours ago"
        }
    ];
};
