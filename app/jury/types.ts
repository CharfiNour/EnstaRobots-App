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

export interface TeamScoreEntry {
    id: string;
    phase?: string;
    status?: string;
}

export interface ScoreState {
    timeMinutes: string;
    timeSeconds: string;
    timeMillis: string;
    completedRoad: boolean;
    homologationPoints: string;
    knockouts: string;
    juryPoints: string;
    damageScore: string;
}
