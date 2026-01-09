import { LucideIcon } from 'lucide-react';

export interface HomeStatCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
}

export interface HomeCompetitionCardProps {
    id: string;
    title: string;
    description: string;
    status: string;
    delay: number;
    isLive?: boolean;
    isViewAll?: boolean;
}

export interface VisitorDashboardData {
    stats: HomeStatCardProps[];
    competitions: HomeCompetitionCardProps[];
}
