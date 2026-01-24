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
    if (typeof window === 'undefined') return INITIAL_COMPS;
    const stored = localStorage.getItem(COMPS_STORAGE_KEY);
    if (!stored) return INITIAL_COMPS;
    try {
        const parsed = JSON.parse(stored);
        // Blend saved state with system definitions to ensure all categories exist
        return INITIAL_COMPS.map(systemComp => {
            const savedComp = parsed.find((p: any) => p.category === systemComp.category || p.id === systemComp.id);
            return savedComp ? { ...systemComp, ...savedComp } : systemComp;
        });
    } catch {
        return INITIAL_COMPS;
    }
};

export const saveAdminCompetitions = (comps: CompetitionListItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COMPS_STORAGE_KEY, JSON.stringify(comps));
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
