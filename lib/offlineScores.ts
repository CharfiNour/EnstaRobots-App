// Offline score storage for judges
// Scores are buffered locally and synced when connectivity is restored

interface OfflineScore {
    id: string;
    matchId: string;
    teamId: string;
    competitionType: 'line_follower' | 'all_terrain' | 'fight';

    // Line Follower / All Terrain
    timeMs?: number;
    penalties?: number;
    bonusPoints?: number;

    // Fight
    knockouts?: number;
    judgePoints?: number;
    damageScore?: number;

    totalPoints: number;
    judgeId: string;
    timestamp: number;
    synced: boolean;
}

const OFFLINE_SCORES_KEY = 'enstarobots_offline_scores';

// Save score offline
export function saveScoreOffline(score: Omit<OfflineScore, 'id' | 'timestamp' | 'synced'>): void {
    if (typeof window === 'undefined') return;

    const offlineScore: OfflineScore = {
        ...score,
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        synced: false,
    };

    const existingScores = getOfflineScores();
    existingScores.push(offlineScore);

    localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(existingScores));
}

// Get all offline scores
export function getOfflineScores(): OfflineScore[] {
    if (typeof window === 'undefined') return [];

    const scoresStr = localStorage.getItem(OFFLINE_SCORES_KEY);
    if (!scoresStr) return [];

    try {
        return JSON.parse(scoresStr);
    } catch {
        return [];
    }
}

// Get unsynced scores
export function getUnsyncedScores(): OfflineScore[] {
    return getOfflineScores().filter((s) => !s.synced);
}

// Mark score as synced
export function markScoreAsSynced(scoreId: string): void {
    if (typeof window === 'undefined') return;

    const scores = getOfflineScores();
    const updatedScores = scores.map((s) =>
        s.id === scoreId ? { ...s, synced: true } : s
    );

    localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(updatedScores));
}

// Clear synced scores (optional cleanup)
export function clearSyncedScores(): void {
    if (typeof window === 'undefined') return;

    const unsyncedScores = getUnsyncedScores();
    localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(unsyncedScores));
}

// Calculate total points based on competition type
export function calculateTotalPoints(
    competitionType: 'line_follower' | 'all_terrain' | 'fight',
    data: Partial<OfflineScore>
): number {
    if (competitionType === 'fight') {
        // Fight: Sum of knockouts, judge points, and damage score
        const knockouts = data.knockouts || 0;
        const judgePoints = data.judgePoints || 0;
        const damageScore = data.damageScore || 0;
        return knockouts * 10 + judgePoints + damageScore;
    } else {
        // Line Follower / All Terrain: Base points - penalties + bonus
        // For time-based: lower time = more points (inverse calculation)
        const timeMs = data.timeMs || 0;
        const penalties = data.penalties || 0;
        const bonusPoints = data.bonusPoints || 0;

        // Base points: 100 - (time in seconds)
        // This is a simplified formula; adjust based on actual rules
        const basePoints = timeMs > 0 ? Math.max(0, 100 - Math.floor(timeMs / 1000)) : 0;
        return Math.max(0, basePoints - penalties + bonusPoints);
    }
}
