import { CompetitionListItem } from '../types';

const COMPS_STORAGE_KEY = 'enstarobots_competitions_v1';

const INITIAL_COMPS: CompetitionListItem[] = [
    {
        id: '1',
        title: 'Junior Line Follower',
        description: 'Young roboticists showcase their skills in precision line following. Perfect for beginners.',
        category: 'junior_line_follower',
        status: 'Essay 1',
        totalTeams: 12,
        totalMatches: 24,
        arena: 'Arena 1 & 2',
        schedule: 'Day 1-2',
        color: 'from-blue-500/20 to-card',
        borderColor: 'border-blue-500/50'
    },
    {
        id: '2',
        title: 'Junior All Terrain',
        description: 'Navigate challenging obstacles and terrain. Tests mechanical design for younger competitors.',
        category: 'junior_all_terrain',
        status: 'Qualifications',
        totalTeams: 16,
        totalMatches: 32,
        arena: 'Arena 3',
        schedule: 'Day 1-3',
        color: 'from-green-500/20 to-card',
        borderColor: 'border-green-500/50'
    },
    {
        id: '3',
        title: 'Line Follower',
        description: 'The ultimate speed challenge. Advanced line-following robots compete for the fastest lap times.',
        category: 'line_follower',
        status: 'Essay 1',
        totalTeams: 20,
        totalMatches: 40,
        arena: 'Arena 1',
        schedule: 'Day 2-4',
        color: 'from-purple-500/20 to-card',
        borderColor: 'border-purple-500/50'
    },
    {
        id: '4',
        title: 'All Terrain',
        description: 'The most demanding robotics challenge. Robots must overcome complex obstacles and ramps.',
        category: 'all_terrain',
        status: 'Qualifications',
        totalTeams: 18,
        totalMatches: 36,
        arena: 'Arena 3 & 4',
        schedule: 'Day 3-5',
        color: 'from-orange-500/20 to-card',
        borderColor: 'border-orange-500/50'
    },
    {
        id: '5',
        title: 'Fight',
        description: 'Head-to-head combat. Robots battle for supremacy in the arena. Strategy and power collide.',
        category: 'fight',
        status: 'Qualifications',
        totalTeams: 16,
        totalMatches: 28,
        arena: 'Main Arena',
        schedule: 'Day 4-5',
        color: 'from-red-500/20 to-card',
        borderColor: 'border-red-500/50'
    },
];

export const getAdminCompetitions = (): CompetitionListItem[] => {
    if (typeof window === 'undefined') return INITIAL_COMPS;
    const stored = localStorage.getItem(COMPS_STORAGE_KEY);
    if (!stored) return INITIAL_COMPS;
    try {
        return JSON.parse(stored);
    } catch {
        return INITIAL_COMPS;
    }
};

export const saveAdminCompetitions = (comps: CompetitionListItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COMPS_STORAGE_KEY, JSON.stringify(comps));
    window.dispatchEvent(new Event('competitions-updated'));
};

export const CATEGORIES = [
    { value: 'junior_line_follower', label: 'Junior Line Follower' },
    { value: 'junior_all_terrain', label: 'Junior All Terrain' },
    { value: 'line_follower', label: 'Line Follower' },
    { value: 'all_terrain', label: 'All Terrain' },
    { value: 'fight', label: 'Fight' },
];

export const PHASES = {
    line: ['Essay 1', 'Essay 2'],
    standard: ['Qualifications', '1/8 Finals', '1/4 Finals', '1/2 Finals', 'Final']
};

export const STATUSES = [
    { value: 'Essay 1', label: 'Essay 1' },
    { value: 'Essay 2', label: 'Essay 2' },
    { value: 'Qualifications', label: 'Qualifications' },
    { value: '1/8 Finals', label: '1/8 Finals' },
    { value: '1/4 Finals', label: '1/4 Finals' },
    { value: '1/2 Finals', label: '1/2 Finals' },
    { value: 'Final', label: 'Final' },
];
export const updateCompetitionStatus = (category: string, status: string) => {
    const competitions = getAdminCompetitions();
    const updated = competitions.map(c =>
        c.category === category ? { ...c, status } : c
    );
    saveAdminCompetitions(updated);
};
