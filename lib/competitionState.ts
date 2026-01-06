
export interface CompetitionState {
    activeTeamId: string | null;
    isLive: boolean; // True when judge pressed Start
    currentPhase: string | null;
    startTime: number | null;
}

const STATE_STORAGE_KEY = 'enstarobots_competition_state_v1';

const INITIAL_STATE: CompetitionState = {
    activeTeamId: null,
    isLive: false,
    currentPhase: null,
    startTime: null,
};

export function getCompetitionState(): CompetitionState {
    if (typeof window === 'undefined') return INITIAL_STATE;

    const stored = localStorage.getItem(STATE_STORAGE_KEY);
    if (!stored) return INITIAL_STATE;

    try {
        return JSON.parse(stored);
    } catch {
        return INITIAL_STATE;
    }
}

export function updateCompetitionState(updates: Partial<CompetitionState>): CompetitionState {
    if (typeof window === 'undefined') return INITIAL_STATE;

    const current = getCompetitionState();
    const newState = { ...current, ...updates };
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(newState));

    // Dispatch event for local updates
    window.dispatchEvent(new Event('competition-state-updated'));
    return newState;
}

export function startLiveSession(teamId: string, phase: string) {
    updateCompetitionState({
        activeTeamId: teamId,
        isLive: true,
        currentPhase: phase,
        startTime: Date.now()
    });
}

export function stopLiveSession() {
    updateCompetitionState({
        isLive: false,
        // Keep activeTeamId for reference until next start? Or clear it?
        // User says: "jump to the next team card after the score card gets submitted"
        // So we might want to update activeTeamId to the *next* one effectively, or just clear live status.
        // Let's just unset live for now.
    });
}
