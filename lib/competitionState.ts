
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

// In-memory state storage (resets on page reload)
let memoryState: CompetitionState = { ...INITIAL_STATE };

// Clean up legacy localStorage on module load
if (typeof window !== 'undefined') {
    try {
        localStorage.removeItem(STATE_STORAGE_KEY);
    } catch { }
}

export function getCompetitionState(): CompetitionState {
    return memoryState;
}

import { fetchAppSettings, updateEventDayStatus as updateAppSettings, updateProfilesLock as updateAppSettingsLock } from './appSettings';

/**
 * Sync Event Day status from Supabase to local state
 * This should be called on page load to ensure cross-device consistency
 */
export async function syncEventDayStatusFromSupabase(): Promise<boolean> {
    try {
        // PRIORITY 1: Check App Settings (Single Source of Truth)
        const settings = await fetchAppSettings();
        if (settings) {
            console.log('[SYNC] App Settings loaded:', {
                event_day_started: settings.event_day_started,
                profiles_locked: settings.profiles_locked
            });

            await updateCompetitionState({
                eventDayStarted: settings.event_day_started ?? false,
                profilesLocked: settings.profiles_locked ?? false
            }, { syncRemote: false, suppressEvent: false });

            return settings.event_day_started ?? false;
        }

        // PRIORITY 2: Fallback to Competitions Table (Legacy)
        console.warn('[SYNC] App Settings table not found or empty. Falling back to Competitions table.');
        const { fetchCompetitionsFromSupabase } = await import('./supabaseData');
        const competitions = await fetchCompetitionsFromSupabase('minimal', true); // Force refresh

        if (competitions && competitions.length > 0) {
            const eventDayStarted = competitions.some((c: any) => c.event_day_started === true);
            const profilesLocked = competitions.every((c: any) => c.profiles_locked === true);

            console.log('[SYNC] Restored from fallback:', { eventDayStarted, profilesLocked });

            // Update local state to match database
            await updateCompetitionState({
                eventDayStarted,
                profilesLocked
            }, { syncRemote: false, suppressEvent: false });

            return eventDayStarted;
        }

        console.error('[SYNC] All sync sources failed. Defaulting to CLOSED.');
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
    const syncRemote = typeof options === 'boolean' ? options : (options.syncRemote ?? false);
    const suppressEvent = typeof options === 'object' ? (options.suppressEvent ?? false) : false;

    // Update in-memory state
    const current = getCompetitionState();

    // Check if anything actually changed to avoid event loops (and unnecessary re-renders)
    const hasChanges = Object.keys(updates).some(key => {
        const k = key as keyof CompetitionState;
        // Direct comparison for simple values, JSON for complex ones
        if (typeof updates[k] !== 'object') return current[k] !== updates[k];
        return JSON.stringify(current[k]) !== JSON.stringify(updates[k]);
    });

    if (!hasChanges) {
        return current;
    }

    const newState = { ...current, ...updates };

    // Synthesize legacy properties for backward compatibility during transition
    const liveKeys = Object.keys(newState.liveSessions);
    newState.isLive = liveKeys.length > 0;

    memoryState = newState;

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

export async function toggleProfilesLock() {
    const state = getCompetitionState();
    const newLocked = !state.profilesLocked;
    console.log(`🔄 [TOGGLE PROFILES LOCK] ${state.profilesLocked ? 'LOCKED → UNLOCKED' : 'UNLOCKED → LOCKED'}`);

    // Update Local State Immediately
    updateCompetitionState({ profilesLocked: newLocked });

    // Sync to AppSettings
    await updateAppSettingsLock(newLocked);

    // Sync to Legacy Competitions Table (Backup)
    syncGlobalProfilesLockToSupabase(newLocked);
}


export async function toggleEventDayStatus() {
    const state = getCompetitionState();
    const newStatus = !state.eventDayStarted;
    console.log(`🔄 [TOGGLE EVENT DAY] ${state.eventDayStarted ? 'LIVE → CLOSED' : 'CLOSED → LIVE'}`);

    // Update Local State Immediately
    updateCompetitionState({ eventDayStarted: newStatus });

    // Sync to AppSettings
    await updateAppSettings(newStatus);

    // Sync to Legacy Competitions Table (Backup)
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
