import { LucideIcon } from 'lucide-react';

export interface AdminStats {
    totalCompetitions: number;
    totalTeams: number;
    totalMatches: number;
    liveMatches: number;
    upcomingMatches: number;
    pendingScores: number;
    eventDuration: string;
}

export interface ActivityItemData {
    icon: LucideIcon;
    text: string;
    time: string;
}

export interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    color: string;
    delay: number;
    highlight?: boolean;
    isEditing?: boolean;
    onChange?: (value: string) => void;
}

export interface ActionCardProps {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
    color: string;
}
