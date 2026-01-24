import { COMPETITION_CATEGORIES } from '@/lib/constants';

export { COMPETITION_CATEGORIES };

export interface CompetitionCategory {
    id: string;
    name: string;
    color: string;
}

export const getCompetitionCategories = () => {
    return COMPETITION_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        color: c.badgeColor
    }));
};
