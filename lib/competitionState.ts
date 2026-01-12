
import { syncLiveStateToSupabase } from './supabaseData';

export interface LiveSession {
    teamId: string;
    phase: string;
    startTime: number;
}

export interface CompetitionState {
    liveSessions: Record<string, LiveSession>; // Map competitionId -> LiveSession
    orderedCompetitions: string[]; // List of competition IDs that are finalized
    profilesLocked: boolean; // Global lock for team profile editing

    // Legacy support (to avoid immediate crashes, but logic will move to liveSessions)
    isLive?: boolean;
    activeCompetitionId?: string | null;
}

const STATE_STORAGE_KEY = 'enstarobots_competition_state_v1';

export const INITIAL_STATE: CompetitionState = {
    liveSessions: {},
    orderedCompetitions: [],
    profilesLocked: false,
    isLive: false,
    activeCompetitionId: null
};

export function getCompetitionState(): CompetitionState {
    if (typeof window === 'undefined') return INITIAL_STATE;

    const stored = localStorage.getItem(STATE_STORAGE_KEY);
    if (!stored) return INITIAL_STATE;

    try {
        const parsed = JSON.parse(stored);

        // Ensure liveSessions exists (migration from old state)
        if (!parsed.liveSessions) {
            parsed.liveSessions = {};
            // Attempt to migrate old single session if exists
            if (parsed.isLive && parsed.activeCompetitionId && parsed.activeTeamId) {
                parsed.liveSessions[parsed.activeCompetitionId] = {
                    teamId: parsed.activeTeamId,
                    phase: parsed.currentPhase || '',
                    startTime: parsed.startTime || Date.now()
                };
            }
        }

        return {
            ...INITIAL_STATE,
            ...parsed,
            orderedCompetitions: parsed.orderedCompetitions || []
        };
    } catch {
        return INITIAL_STATE;
    }
}

export function updateCompetitionState(updates: Partial<CompetitionState>): CompetitionState {
    if (typeof window === 'undefined') return INITIAL_STATE;

    const current = getCompetitionState();
    const newState = { ...current, ...updates };

    // Synthesize legacy properties for backward compatibility during transition
    const liveKeys = Object.keys(newState.liveSessions);
    newState.isLive = liveKeys.length > 0;
    // activeCompetitionId is ambiguous with multiple sessions, but we leave it null or last active?
    // We'll leave it as is or null.

    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(newState));

    // Sync to Supabase if liveSessions changed
    if (updates.liveSessions) {
        syncLiveStateToSupabase(newState.liveSessions).catch((err: any) =>
            console.error("Failed to sync live state:", err)
        );
    }

    // Dispatch event for local updates
    window.dispatchEvent(new Event('competition-state-updated'));
    return newState;
}

export function toggleCompetitionOrdered(compId: string) {
    const state = getCompetitionState();
    const isOrdered = state.orderedCompetitions.includes(compId);

    let newOrdered = [...state.orderedCompetitions];
    if (isOrdered) {
        newOrdered = newOrdered.filter(id => id !== compId);
    } else {
        newOrdered.push(compId);
    }

    updateCompetitionState({ orderedCompetitions: newOrdered });
}

export function toggleProfilesLock() {
    const state = getCompetitionState();
    updateCompetitionState({ profilesLocked: !state.profilesLocked });
}

export function startLiveSession(teamId: string, competitionId: string, phase: string) {
    const state = getCompetitionState();
    const newSessions = { ...state.liveSessions };

    newSessions[competitionId] = {
        teamId,
        phase,
        startTime: Date.now()
    };

    updateCompetitionState({
        liveSessions: newSessions
    });
}

export function stopLiveSession(competitionId?: string) {
    const state = getCompetitionState();
    const newSessions = { ...state.liveSessions };

    if (competitionId) {
        // Stop specific competition session
        delete newSessions[competitionId];
    } else {
        // Stop ALL sessions (legacy behavior fallback)
        for (const key in newSessions) delete newSessions[key];
    }

    updateCompetitionState({
        liveSessions: newSessions
    });
}
