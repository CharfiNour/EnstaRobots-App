import { Trophy, Users, Calendar, Bell } from 'lucide-react';
import { AdminStats, ActivityItemData } from '../types';

import { fetchAppSettings, updateDashboardStats } from '@/lib/appSettings';

const DEFAULT_STATS: AdminStats = {
    totalCompetitions: 0,
    totalTeams: 0,
    totalMatches: 0,
    liveMatches: 0,
    upcomingMatches: 0,
    pendingScores: 0,
    eventDuration: "Preparing",
};

export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        const settings = await fetchAppSettings();
        if (settings) {
            return {
                ...DEFAULT_STATS,
                totalCompetitions: settings.total_competitions ?? 0,
                totalTeams: settings.total_teams ?? 0,
                totalMatches: settings.total_matches ?? 0,
                eventDuration: settings.event_duration ?? "TBD"
            };
        }
    } catch (e) {
        console.error('Error fetching admin stats:', e);
    }
    return DEFAULT_STATS;
};

export const saveAdminStats = async (stats: AdminStats): Promise<void> => {
    await updateDashboardStats({
        total_competitions: stats.totalCompetitions,
        total_teams: stats.totalTeams,
        total_matches: stats.totalMatches,
        event_duration: stats.eventDuration
    });
};

export const getRecentActivity = (): ActivityItemData[] => {
    return [
        {
            icon: Trophy,
            text: "Competition 'All Terrain' status changed to Finals",
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
