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
    detailedScores?: Record<string, number>;
    juryId: string;
    timestamp: number;
    synced: boolean;
    isSentToTeam?: boolean;
    status?: string;
    remarks?: string;
}

const OFFLINE_SCORES_KEY = 'enstarobots_offline_scores_v2';

// In-memory score buffer (RAM only)
let memoryScores: OfflineScore[] = [];

// Clean up legacy localStorage on module load
if (typeof window !== 'undefined') {
    try {
        if (localStorage.getItem(OFFLINE_SCORES_KEY)) {
            localStorage.removeItem(OFFLINE_SCORES_KEY);
            console.log('🧹 [SCORES] Legacy offline scores cleared');
        }
    } catch { }
}

// Save score offline (to memory)
export function saveScoreOffline(score: Omit<OfflineScore, 'id' | 'timestamp' | 'synced'>): void {
    const offlineScore: OfflineScore = {
        ...score,
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        synced: false,
    };

    memoryScores.push(offlineScore);
    console.log('📝 [SCORE] Saved to memory buffer', offlineScore.id);
}

// Get all offline scores (from memory)
export function getOfflineScores(): OfflineScore[] {
    return memoryScores;
}

// Clear ALL offline scores (for reset purposes)
export function clearAllOfflineScores(): void {
    memoryScores = [];
    if (typeof window !== 'undefined') {
        localStorage.removeItem(OFFLINE_SCORES_KEY);
    }
}

// Clear offline scores for a specific category (by ID variants)
export function clearOfflineScoresForCategory(identifiers: string[]): void {
    memoryScores = memoryScores.filter(s => {
        // If score's competitionType matches ANY of the identifiers, filter it out
        const type = String(s.competitionType || '').toLowerCase();
        return !identifiers.some(id => id.toLowerCase() === type);
    });
}

// Get unsynced scores
export function getUnsyncedScores(): OfflineScore[] {
    return getOfflineScores().filter((s) => !s.synced);
}

// Mark score as synced
export function markScoreAsSynced(scoreId: string): void {
    memoryScores = memoryScores.map((s) =>
        s.id === scoreId ? { ...s, synced: true } : s
    );
}

// Mark score as sent to team
export function sendScoreToTeam(scoreId: string): void {
    memoryScores = memoryScores.map((s) =>
        s.id === scoreId ? { ...s, isSentToTeam: true } : s
    );
}

// Delete score
export function deleteScore(scoreId: string): void {
    memoryScores = memoryScores.filter((s) => s.id !== scoreId);
}

// Update score
export function updateScore(scoreId: string, updates: Partial<OfflineScore>): void {
    memoryScores = memoryScores.map((s) => {
        if (s.id === scoreId) {
            const updated = { ...s, ...updates };
            // Recalculate total points if critical fields changed
            updated.totalPoints = calculateTotalPoints(updated.competitionType, updated);
            return updated;
        }
        return s;
    });
}

// Clear synced scores (optional cleanup)
export function clearSyncedScores(): void {
    memoryScores = getUnsyncedScores();
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
        // Line Follower: The total points are purely the sum of the tactical segments 
        // (homologationPoints). Time is recorded separately for ranking but not added to the score.
        return data.bonusPoints || 0;
    } else {
        // All Terrain etc.
        const timeMs = data.timeMs || 0;
        const bonusPoints = data.bonusPoints || 0;
        const basePoints = timeMs > 0 ? Math.max(0, 100 - Math.floor(timeMs / 1000)) : 0;
        return Math.max(0, basePoints + bonusPoints);
    }
}
