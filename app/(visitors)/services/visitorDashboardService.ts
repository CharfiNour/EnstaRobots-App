import { Trophy, Users, Zap, Calendar } from 'lucide-react';
import { VisitorDashboardData } from '../types';
import { getAdminCompetitions } from '../../admin/competitions/services/competitionService';
import { getCompetitionState } from '@/lib/competitionState';
import { getAdminStats } from '../../admin/services/dashboardService';

export const getVisitorDashboardData = (): VisitorDashboardData => {
    const competitions = getAdminCompetitions();
    const competitionState = getCompetitionState();
    const overrideStats = getAdminStats();

    // Calculate aggregated stats (fallbacks)
    const totalTeams = competitions.reduce((sum, comp) => sum + comp.totalTeams, 0);
    const totalMatches = competitions.reduce((sum, comp) => sum + comp.totalMatches, 0);
    const activeCompetitionsCount = competitions.length;

    // Map admin competitions to dashboard display format
    const dashboardCompetitions: (import('../types').HomeCompetitionCardProps)[] = competitions.map((comp, index) => {
        const liveSession = competitionState.liveSessions[comp.category];
        const isLive = !!liveSession;
        let displayStatus = comp.status;

        if (isLive) {
            displayStatus = "Live Now";
        }

        return {
            id: comp.id,
            title: comp.title,
            description: comp.description,
            status: displayStatus,
            delay: index * 0.1,
            isLive: isLive,
        };
    });

    // Add "View All" card
    dashboardCompetitions.push({
        id: "0",
        title: "View All",
        description: "Explore the complete competition schedule.",
        status: "",
        delay: dashboardCompetitions.length * 0.1,
        isViewAll: true,
    });

    return {
        stats: [
            {
                icon: Trophy,
                label: "Competitions",
                value: overrideStats?.totalCompetitions?.toString() || activeCompetitionsCount.toString()
            },
            {
                icon: Users,
                label: "Teams",
                value: overrideStats?.totalTeams?.toString() || totalTeams.toString()
            },
            {
                icon: Zap,
                label: "Matches",
                value: overrideStats?.totalMatches?.toString() || totalMatches.toString()
            },
            {
                icon: Calendar,
                label: "Event Duration",
                value: overrideStats?.eventDuration || "3 Days"
            },
        ],
        competitions: dashboardCompetitions
    };
};
