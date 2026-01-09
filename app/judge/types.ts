import { LucideIcon } from 'lucide-react';

export interface JudgeActionCardProps {
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

export interface JudgeDashboardData {
    activeMatches: MatchData[];
    guidelines: string[];
}
