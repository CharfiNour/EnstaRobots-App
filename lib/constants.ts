/**
 * SHARED CONSTANTS FOR ENSTAROBOTS
 */

export const COMPETITION_CATEGORIES = [
    {
        id: 'junior_line_follower',
        name: 'Junior Line Follower',
        type: 'junior_line_follower',
        color: 'from-cyan-500/20 to-card',
        borderColor: 'border-cyan-500/50',
        badgeColor: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    },
    {
        id: 'junior_all_terrain',
        name: 'Junior All Terrain',
        type: 'junior_all_terrain',
        color: 'from-emerald-500/20 to-card',
        borderColor: 'border-emerald-500/50',
        badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
        id: 'line_follower',
        name: 'Line Follower',
        type: 'line_follower',
        color: 'from-indigo-500/20 to-card',
        borderColor: 'border-indigo-500/50',
        badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    },
    {
        id: 'all_terrain',
        name: 'All Terrain',
        type: 'all_terrain',
        color: 'from-orange-500/20 to-card',
        borderColor: 'border-orange-500/50',
        badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    },
    {
        id: 'fight',
        name: 'Fight',
        type: 'fight',
        color: 'from-rose-500/20 to-card',
        borderColor: 'border-rose-500/50',
        badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    },
];

export const CATEGORY_PHASES: Record<string, string[]> = {
    line: ['Essay 1', 'Essay 2'],
    standard: ['Qualifications', '1/8 Finals', '1/4 Finals', '1/2 Finals', 'Final'],
    fight: ['Qualifications', 'Quarter-Finals', 'Semi-Finals', 'Final']
};

export const ALL_STATUSES = [
    'upcoming',
    'Essay 1',
    'Essay 2',
    'Qualifications',
    '1/8 Finals',
    '1/4 Finals',
    '1/2 Finals',
    'Final',
    'completed'
];

export const LEGACY_ID_MAP: Record<string, string> = {
    'junior_line_follower': '1',
    'junior_all_terrain': '2',
    'line_follower': '3',
    'all_terrain': '4',
    'fight': '5'
};

export const UUID_MAP: Record<string, string> = {
    '60eb8fd5-867d-42ab-b8a0-cacd4515101f': 'junior_line_follower',
    'f161dc54-6c30-4405-b142-909f4187c486': 'junior_all_terrain',
    'ccf1d967-0071-4281-97d0-1ebc359972a4': 'line_follower',
    '0ea82341-6b73-4418-a4b9-b040492074f6': 'all_terrain',
    'c303ea7d-59a2-43d7-9084-b5a3c1b83811': 'fight'
};

export function getPhasesForCategory(categoryType: string): string[] {
    if (categoryType === 'line_follower' || categoryType === 'junior_line_follower') {
        return CATEGORY_PHASES.line;
    }
    if (categoryType === 'fight') {
        return CATEGORY_PHASES.fight;
    }
    return CATEGORY_PHASES.standard;
}

export function getCategoryMetadata(categoryOrId: string) {
    return COMPETITION_CATEGORIES.find(c => c.id === categoryOrId || c.type === categoryOrId);
}

export function getCompetitionName(idOrSlug: string | undefined, dbComps: any[] = []): string {
    if (!idOrSlug) return 'Not Assigned';

    // 1. Check local standard categories
    const localMatch = getCategoryMetadata(idOrSlug);
    if (localMatch) return localMatch.name;

    // 2. Check provided DB competitions (for UUID lookups)
    const dbMatch = dbComps.find(c => c.id === idOrSlug || c.type === idOrSlug);
    if (dbMatch) return dbMatch.name;

    // 3. Fallback: formatted slug
    return idOrSlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export const STATUS_OPTIONS = [
    { value: 'winner', label: 'Winner', color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'qualified', label: 'Qualified', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'eliminated', label: 'Eliminated', color: 'text-red-600 dark:text-red-400' },
];

export const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const LINE_FOLLOWER_SECTIONS_STANDARD = [
    { id: '1', label: 'Segment 1', maxPoints: 10, image: '/assets/line-follower/image7.png' },
    { id: '2', label: 'Segment 2', maxPoints: 10, image: '/assets/line-follower/image5.png' },
    { id: '3', label: 'Segment 3', maxPoints: 20, image: '/assets/line-follower/image6.png' },
    { id: '4', label: 'Segment 4', maxPoints: 30, image: '/assets/line-follower/image3.png' },
    { id: '5', label: 'Segment 5', maxPoints: 30, image: '/assets/line-follower/image2.png' },
    { id: '6', label: 'Segment 6', maxPoints: 40, image: '/assets/line-follower/image8.png' },
    { id: '7', label: 'Segment 7', maxPoints: 20, image: '/assets/line-follower/image1.png' },
    { id: '8', label: 'Segment 8', maxPoints: 25, image: '/assets/line-follower/image4.png' },
    { id: '9', label: 'Segment 9', maxPoints: 30, image: '/assets/line-follower/image9.png' },
];

export const LINE_FOLLOWER_SECTIONS_JUNIOR = [
    { id: '1', label: 'Segment 1', maxPoints: 20, image: '/assets/junior-line-follower/image7.png' },
    { id: '2', label: 'Segment 2', maxPoints: 20, image: '/assets/junior-line-follower/image2.png' },
    { id: '3', label: 'Segment 3', maxPoints: 30, image: '/assets/junior-line-follower/image6.png' },
    { id: '4', label: 'Segment 4', maxPoints: 20, image: '/assets/junior-line-follower/image1.png' },
    { id: '5', label: 'Segment 5', maxPoints: 10, image: '/assets/junior-line-follower/image8.png' },
    { id: '6', label: 'Segment 6', maxPoints: 30, image: '/assets/junior-line-follower/image3.png' },
    { id: '7', label: 'Segment 7', maxPoints: 30, image: '/assets/junior-line-follower/image5.png' },
];
export function canonicalizeCompId(id: string | any | undefined, dbComps: any[] = []): string {
    if (!id) return '';
    const idStr = String(id);

    const LEGACY_ID_MAP: Record<string, string> = {
        '1': 'junior_line_follower',
        '2': 'junior_all_terrain',
        '3': 'line_follower',
        '4': 'all_terrain',
        '5': 'fight'
    };

    const UUID_MAP: Record<string, string> = {
        '60eb8fd5-867d-42ab-b8a0-cacd4515101f': 'junior_line_follower',
        'f161dc54-6c30-4405-b142-909f4187c486': 'junior_all_terrain',
        'ccf1d967-0071-4281-97d0-1ebc359972a4': 'line_follower',
        '0ea82341-6b73-4418-a4b9-b040492074f6': 'all_terrain',
        'c303ea7d-59a2-43d7-9084-b5a3c1b83811': 'fight'
    };

    // 1. Direct match with standard category types (the "canonical" form)
    if (COMPETITION_CATEGORIES.some(c => c.type === idStr)) return idStr;

    // 2. Check legacy numeric IDs
    if (LEGACY_ID_MAP[idStr]) return LEGACY_ID_MAP[idStr];

    // 3. Check UUIDs (from constants or DB)
    if (UUID_MAP[idStr]) return UUID_MAP[idStr];

    // 4. Robust DB lookup
    const dbMatch = dbComps.find(c => c.id === idStr || c.type === idStr);
    if (dbMatch) return dbMatch.type || dbMatch.id;

    return idStr;
}
