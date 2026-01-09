import { Users, Trophy } from 'lucide-react';
import { TeamDashboardData } from '../types';

export const getTeamDashboardData = (): TeamDashboardData => {
    return {
        matches: [
            {
                id: '1',
                round: 'Qualifiers - Round 1',
                arena: 'Arena 1',
                opponent: 'SpeedRacers',
                status: 'upcoming',
                scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                competition: 'Line Follower',
            },
            {
                id: '2',
                round: 'Qualifiers - Round 2',
                arena: 'Arena 2',
                opponent: 'QuickBots',
                status: 'upcoming',
                scheduledTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
                competition: 'Line Follower',
            }
        ],
        systemStatus: {
            syncPercentage: 65,
            statusText: "All competition clusters are currently reporting normal telemetry."
        },
        directives: [
            {
                icon: Users,
                title: "Unit Integrity",
                description: "Active credentials required.",
                colorClass: "bg-emerald-500/10 text-emerald-500"
            },
            {
                icon: Trophy,
                title: "Victory Protocol",
                description: "Outperform expectations.",
                colorClass: "bg-rose-500/10 text-rose-500"
            }
        ]
    };
};

export const COMPETITION_CONFIG: Record<string, { name: string, color: string }> = {
    junior_line_follower: { name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    junior_all_terrain: { name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    line_follower: { name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    all_terrain: { name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    fight: { name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
};
