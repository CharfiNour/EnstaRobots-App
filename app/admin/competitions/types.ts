export interface CompetitionListItem {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    totalTeams: number;
    totalMatches: number;
    arena: string;
    schedule: string;
    color: string;
    borderColor: string;
    isLive?: boolean;
}
