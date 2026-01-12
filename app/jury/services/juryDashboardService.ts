import { JuryDashboardData } from '../types';

export const getJuryDashboardData = (): JuryDashboardData => {
    return {
        activeMatches: [],
        guidelines: [
            "Scores are saved locally first and synced when online",
            "Double-check team names before submitting scores",
            "Each competition has different scoring criteria",
            "For Line Follower/All Terrain: Record time, penalties, and bonuses",
            "For Fight: Record knockouts, judge points, and damage scores",
            "Contact admin if you need to modify a submitted score"
        ]
    };
};
