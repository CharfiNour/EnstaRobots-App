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

// IMPORTANT: Offline score storage and local persistence have been DISABLED as per request.
// This module now acts as a pass-through and utility provider only.

let memoryScores: OfflineScore[] = [];

// Save score offline - DISABLED (Does nothing)
export function saveScoreOffline(score: any): void {
    console.warn('⚠️ [OFFLINE] saveScoreOffline called but persistence is DISABLED.');
}

// Get all offline scores - ALWAYS EMPTY
export function getOfflineScores(): OfflineScore[] {
    return [];
}

// Clear ALL offline scores - NO-OP
export function clearAllOfflineScores(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('enstarobots_offline_scores_v3');
        localStorage.removeItem('enstarobots_offline_scores_v2');
    }
}

// Clear offline scores for a specific category - NO-OP
export function clearOfflineScoresForCategory(identifiers: string[]): void { }

// Get unsynced scores - ALWAYS EMPTY
export function getUnsyncedScores(): OfflineScore[] {
    return [];
}

// Mark score as synced - NO-OP
export function markScoreAsSynced(scoreId: string): void { }

// Mark score as sent to team - NO-OP
export function sendScoreToTeam(scoreId: string): void { }

// Delete score - NO-OP
export function deleteScore(scoreId: string): void { }

// Update score - NO-OP
export function updateScore(scoreId: string, updates: Partial<OfflineScore>): void { }

// Clear synced scores - NO-OP
export function clearSyncedScores(): void { }

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
