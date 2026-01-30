import { CompetitionListItem } from '../types';
import { COMPETITION_CATEGORIES, ALL_STATUSES, CATEGORY_PHASES } from '@/lib/constants';

const COMPS_STORAGE_KEY = 'enstarobots_competitions_v1';

// Dynamic default state pulled from shared constants
const INITIAL_COMPS: CompetitionListItem[] = COMPETITION_CATEGORIES.map(c => ({
    id: c.id,
    title: c.name,
    description: `Official ${c.name} tournament.`,
    category: c.type,
    status: 'Qualifications',
    totalTeams: 0,
    totalMatches: 0,
    arena: 'Main Arena',
    schedule: 'Full Event',
    color: c.color,
    borderColor: c.borderColor
}));

export const getAdminCompetitions = (): CompetitionListItem[] => {
    // Return initial state to force fresh fetch/sync
    if (typeof window !== 'undefined') {
        localStorage.removeItem(COMPS_STORAGE_KEY);
    }
    return INITIAL_COMPS;
};

export const saveAdminCompetitions = (comps: CompetitionListItem[]) => {
    if (typeof window === 'undefined') return;
    // No-op persistence
    window.dispatchEvent(new Event('competitions-updated'));
};

export const CATEGORIES = COMPETITION_CATEGORIES.map(c => ({ value: c.type, label: c.name }));

export const PHASES = CATEGORY_PHASES;

export const STATUSES = ALL_STATUSES.map(s => ({ value: s, label: s }));

export const updateCompetitionStatus = (category: string, status: string) => {
    const competitions = getAdminCompetitions();
    const updated = competitions.map(c =>
        c.category === category ? { ...c, status } : c
    );
    saveAdminCompetitions(updated);
};
