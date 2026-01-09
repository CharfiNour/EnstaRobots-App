import { Trophy, Users, Calendar, Bell } from 'lucide-react';
import { AdminStats, ActivityItemData } from '../types';

export const getAdminStats = (): AdminStats => {
    // Mock stats - will be replaced with real Supabase queries later
    return {
        totalCompetitions: 5,
        totalTeams: 48,
        totalMatches: 156,
        liveMatches: 2,
        upcomingMatches: 12,
        pendingScores: 3,
    };
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
