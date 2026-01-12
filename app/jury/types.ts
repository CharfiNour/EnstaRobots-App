import { LucideIcon } from 'lucide-react';

export interface JuryActionCardProps {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
    isPrimary?: boolean;
}

export interface MatchData {
    id: string;
    title: string;
}

export interface JuryDashboardData {
    activeMatches: MatchData[];
    guidelines: string[];
}
