
import { syncLiveStateToSupabase, deleteLiveSessionFromSupabase, syncGlobalProfilesLockToSupabase, syncGlobalEventDayStatusToSupabase } from './supabaseData';

export interface LiveSession {
    teamId: string;
    phase: string;
    startTime: number;
    scoreSummary?: {
        time?: number; // Total ms
        points?: number; // Total points
        completedRoad?: boolean;
        [key: string]: any;
    };
    lastUpdate?: number;
}

export interface CompetitionState {
    liveSessions: Record<string, LiveSession>; // Map competitionId -> LiveSession
    orderedCompetitions: string[]; // List of competition IDs that are finalized
    profilesLocked: boolean; // Global lock for team profile editing
    eventDayStarted: boolean; // Global flag for event day access (Matches, Announcements, Score)

    // Legacy support (to avoid immediate crashes, but logic will move to liveSessions)
    isLive?: boolean;
    activeCompetitionId?: string | null;
    terminationTimestamps: Record<string, number>; // competitionId -> timestamp
}

const STATE_STORAGE_KEY = 'enstarobots_competition_state_v1';

const INITIAL_STATE: CompetitionState = {
    liveSessions: {},
    orderedCompetitions: [],
    profilesLocked: false,
    eventDayStarted: false,
    isLive: false,
    activeCompetitionId: null,
    terminationTimestamps: {}
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
            orderedCompetitions: parsed.orderedCompetitions || [],
            terminationTimestamps: parsed.terminationTimestamps || {}
        };
    } catch {
        return INITIAL_STATE;
    }
}

/**
 * Sync Event Day status from Supabase to local state
 * This should be called on page load to ensure cross-device consistency
 */
export async function syncEventDayStatusFromSupabase(): Promise<boolean> {
    try {
        const { fetchCompetitionsFromSupabase } = await import('./supabaseData');
        const competitions = await fetchCompetitionsFromSupabase('minimal', true); // Force refresh

        if (competitions && competitions.length > 0) {
            // Use the first competition's event_day_started status as the global flag
            const eventDayStarted = competitions[0].event_day_started || false;
            console.log('[SYNC] Event Day status from Supabase:', eventDayStarted);

            // Update local state to match database
            await updateCompetitionState({ eventDayStarted }, { syncRemote: false, suppressEvent: false });

            return eventDayStarted;
        }

        return false;
    } catch (error) {
        console.error('[SYNC ERROR] Failed to fetch event day status from Supabase:', error);
        return getCompetitionState().eventDayStarted; // Fallback to cached state
    }
}

export async function updateCompetitionState(
    updates: Partial<CompetitionState>,
    options: boolean | { syncRemote?: boolean, suppressEvent?: boolean } = false
): Promise<CompetitionState> {
    if (typeof window === 'undefined') return INITIAL_STATE;

    const syncRemote = typeof options === 'boolean' ? options : (options.syncRemote ?? false);
    const suppressEvent = typeof options === 'object' ? (options.suppressEvent ?? false) : false;

    const current = getCompetitionState();
    const newState = { ...current, ...updates };

    // Synthesize legacy properties for backward compatibility during transition
    const liveKeys = Object.keys(newState.liveSessions);
    newState.isLive = liveKeys.length > 0;

    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(newState));

    // Sync to Supabase if liveSessions changed AND syncRemote is true
    if (updates.liveSessions && syncRemote) {
        try {
            await syncLiveStateToSupabase(newState.liveSessions);
        } catch (err: any) {
            console.warn("Failed to sync live state (likely offline):", err);
        }
    }

    // Dispatch event for local updates
    if (!suppressEvent) {
        window.dispatchEvent(new Event('competition-state-updated'));
    }
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
    const newLocked = !state.profilesLocked;
    updateCompetitionState({ profilesLocked: newLocked });
    syncGlobalProfilesLockToSupabase(newLocked);
}

export function toggleEventDayStatus() {
    const state = getCompetitionState();
    const newStatus = !state.eventDayStarted;
    updateCompetitionState({ eventDayStarted: newStatus });
    syncGlobalEventDayStatusToSupabase(newStatus);
}

export async function startLiveSession(teamId: string, competitionId: string, phase: string) {
    const state = getCompetitionState();
    const newSessions = { ...state.liveSessions };

    newSessions[competitionId] = {
        teamId,
        phase,
        startTime: Date.now()
    };

    await updateCompetitionState({
        liveSessions: newSessions
    }, { syncRemote: true });
}

export async function stopLiveSession(competitionId?: string) {
    const state = getCompetitionState();
    const newSessions = { ...state.liveSessions };
    const promises: Promise<any>[] = [];

    if (competitionId) {
        // Stop specific competition session
        delete newSessions[competitionId];
        // Explicitly delete from Supabase
        promises.push(deleteLiveSessionFromSupabase(competitionId));

        // Persist termination timestamp to prevent stale re-upserts in background
        const currentTimestamps = { ...(state.terminationTimestamps || {}) };
        currentTimestamps[competitionId] = Date.now();
        await updateCompetitionState({
            liveSessions: newSessions,
            terminationTimestamps: currentTimestamps
        }, { syncRemote: true });
    } else {
        // Stop ALL sessions (legacy behavior fallback)
        const currentTimestamps = { ...(state.terminationTimestamps || {}) };
        for (const key in newSessions) {
            promises.push(deleteLiveSessionFromSupabase(key));
            delete newSessions[key];
            currentTimestamps[key] = Date.now();
        }
        await updateCompetitionState({
            liveSessions: newSessions,
            terminationTimestamps: currentTimestamps
        }, { syncRemote: true });
    }

    // Await all deletions (background network operations)
    try {
        await Promise.all(promises);
    } catch (err) {
        console.warn("Errors during Supabase session teardown (likely offline):", err);
    }
}
