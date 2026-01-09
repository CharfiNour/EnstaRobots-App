import { CompetitionListItem } from '../types';

export const getAdminCompetitions = (): CompetitionListItem[] => {
    return [
        {
            id: '1',
            title: 'Junior Line Follower',
            category: 'junior_line_follower',
            status: 'qualifiers',
            totalTeams: 12,
            totalMatches: 24,
        },
        {
            id: '2',
            title: 'Line Follower',
            category: 'line_follower',
            status: 'knockout',
            totalTeams: 20,
            totalMatches: 40,
        },
        {
            id: '3',
            title: 'Fight',
            category: 'fight',
            status: 'finals',
            totalTeams: 16,
            totalMatches: 28,
        },
    ];
};

export const CATEGORIES = [
    { value: 'junior_line_follower', label: 'Junior Line Follower' },
    { value: 'junior_all_terrain', label: 'Junior All Terrain' },
    { value: 'line_follower', label: 'Line Follower' },
    { value: 'all_terrain', label: 'All Terrain' },
    { value: 'fight', label: 'Fight (Battle Robots)' },
];

export const STATUSES = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'qualifiers', label: 'Qualifiers' },
    { value: 'group_stage', label: 'Group Stage' },
    { value: 'knockout', label: 'Knockout' },
    { value: 'finals', label: 'Finals' },
    { value: 'completed', label: 'Completed' },
];
