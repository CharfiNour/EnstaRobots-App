import { LucideIcon } from 'lucide-react';

export interface CompetitionOption {
    value: string;
    label: string;
    color: string;
    bg: string;
    border: string;
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
    judgePoints: string;
    damageScore: string;
}
