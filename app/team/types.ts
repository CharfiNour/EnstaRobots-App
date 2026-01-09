import { LucideIcon } from 'lucide-react';

export interface TeamDashboardMatch {
    id: string;
    round: string;
    arena: string;
    opponent: string;
    status: 'upcoming' | 'live' | 'completed';
    scheduledTime: string;
    competition: string;
}

export interface TeamDashboardData {
    matches: TeamDashboardMatch[];
    systemStatus: {
        syncPercentage: number;
        statusText: string;
    };
    directives: {
        icon: LucideIcon;
        title: string;
        description: string;
        colorClass: string;
    }[];
}
