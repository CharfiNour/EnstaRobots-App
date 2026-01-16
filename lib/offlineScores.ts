// Offline score storage for juries
// Scores are buffered locally and synced when connectivity is restored

export interface OfflineScore {
    id: string;
    matchId: string;
    teamId: string;
    competitionType: 'junior_line_follower' | 'line_follower' | 'junior_all_terrain' | 'all_terrain' | 'fight' | 'homologation' | string;

    // Common fields
    phase?: string;
    juryNames?: string[];

    // Line Follower / All Terrain
    timeMs?: number;
    bonusPoints?: number;
    completedRoad?: boolean;

    // Fight
    knockouts?: number;
    juryPoints?: number;
    damageScore?: number;

    totalPoints: number;
    juryId: string;
    timestamp: number;
    synced: boolean;
    isSentToTeam?: boolean;
    status?: string;
}

const OFFLINE_SCORES_KEY = 'enstarobots_offline_scores_v2';

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
    if (!scoresStr) {
        return [];
    }

    try {
        return JSON.parse(scoresStr);
    } catch {
        return [];
    }
}

// Clear ALL offline scores (for reset purposes)
export function clearAllOfflineScores(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(OFFLINE_SCORES_KEY);
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

// Mark score as sent to team
export function sendScoreToTeam(scoreId: string): void {
    if (typeof window === 'undefined') return;

    const scores = getOfflineScores();
    const updatedScores = scores.map((s) =>
        s.id === scoreId ? { ...s, isSentToTeam: true } : s
    );

    localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(updatedScores));
}

// Delete score
export function deleteScore(scoreId: string): void {
    if (typeof window === 'undefined') return;

    const scores = getOfflineScores();
    const updatedScores = scores.filter((s) => s.id !== scoreId);

    localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(updatedScores));
}

// Update score
export function updateScore(scoreId: string, updates: Partial<OfflineScore>): void {
    if (typeof window === 'undefined') return;

    const scores = getOfflineScores();
    const updatedScores = scores.map((s) => {
        if (s.id === scoreId) {
            const updated = { ...s, ...updates };
            // Recalculate total points if critical fields changed
            updated.totalPoints = calculateTotalPoints(updated.competitionType, updated);
            return updated;
        }
        return s;
    });

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
    competitionType: string,
    data: Partial<OfflineScore>
): number {
    if (competitionType === 'fight') {
        // Fight: Sum of knockouts, judge points, and damage score
        const knockouts = data.knockouts || 0;
        const juryPoints = data.juryPoints || 0;
        const damageScore = data.damageScore || 0;
        return knockouts * 10 + juryPoints + damageScore;
    } else if (competitionType.includes('line_follower') || competitionType === 'homologation') {
        const timeMs = data.timeMs || 0;
        const bonusPoints = data.bonusPoints || 0;

        // Base points logic for line followers
        const basePoints = timeMs > 0 ? Math.max(0, 300 - Math.floor(timeMs / 1000)) : 0;
        return Math.max(0, basePoints + bonusPoints);
    } else {
        // All Terrain etc.
        const timeMs = data.timeMs || 0;
        const bonusPoints = data.bonusPoints || 0;
        const basePoints = timeMs > 0 ? Math.max(0, 100 - Math.floor(timeMs / 1000)) : 0;
        return Math.max(0, basePoints + bonusPoints);
    }
}
