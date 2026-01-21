export interface TeamMember {
    name: string;
    role: string;
    isLeader?: boolean;
}

export interface Team {
    id: string;
    name: string; // This will now effectively be the Robot Name
    robotName?: string;
    club: string;
    university: string;
    logo: string;
    photo?: string;
    code?: string;
    competition?: string;
    members: TeamMember[];
    isPlaceholder?: boolean;
    visualsLocked?: boolean;
}

const INITIAL_TEAMS: Team[] = [];

const TEAMS_STORAGE_KEY = 'enstarobots_teams_v1';

export function getTeams(): Team[] {
    if (typeof window === 'undefined') return INITIAL_TEAMS;

    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    let teams = INITIAL_TEAMS;

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Self-healing: Patch stored teams with missing static data from INITIAL_TEAMS
            teams = parsed.map((t: Team) => {
                const seed = INITIAL_TEAMS.find(i => i.id === t.id);
                if (seed) {
                    return {
                        ...t,
                        competition: t.competition || seed.competition,
                        code: t.code || seed.code,
                        organization: (t as any).organization || t.university,
                    };
                }
                return t;
            }).filter((t: Team) => !['1', '2', '3', '4'].includes(t.id)); // Purge legacy dummy data
        } catch {
            teams = INITIAL_TEAMS;
        }
    }

    // Deduplicate by ID to prevent React key errors
    const seen = new Set();
    const uniqueTeams = teams.filter(team => {
        if (seen.has(team.id)) return false;
        seen.add(team.id);
        return true;
    });

    // If storage was updated/patched, save it back
    if (JSON.stringify(uniqueTeams) !== stored) {
        saveTeams(uniqueTeams);
    }

    return uniqueTeams;
}

export function saveTeams(teams: Team[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
}

// Helper to update team order
// Note: This logic now needs to be handled by the UI + Supabase updates
export function reorderTeams(teams: Team[], startIndex: number, endIndex: number): Team[] {
    const result = Array.from(teams);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

// Generate a specific number of team slots (Pure function)
export function generateEmptyTeams(count: number): Team[] {
    const newTeams: Team[] = [];

    for (let i = 0; i < count; i++) {
        const id = `slot-${Math.random().toString(36).substring(2, 7)}`;
        newTeams.push({
            id,
            name: `Slot`,
            robotName: '',
            club: '',
            university: '',
            logo: `https://api.dicebear.com/7.x/identicon/svg?seed=team-${id}`,
            code: `ENSTA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            members: [],
            isPlaceholder: true
        });
    }

    return newTeams;
}

/**
 * Adds a specific number of team slots for a given club.
 * Returns the NEW teams only.
 */
export function generateClubSlots(clubName: string, count: number): Team[] {
    const newTeams: Team[] = [];

    // Create a clean prefix from club name (e.g. "RoboKnights" -> "ROBO")
    const prefix = clubName.trim().toUpperCase().replace(/\s+/g, '').substring(0, 4) || 'TEAM';

    for (let i = 0; i < count; i++) {
        const id = `club-${prefix.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;
        // Generate a 4-char unique suffix
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();

        newTeams.push({
            id,
            name: `Slot`,
            robotName: '',
            club: clubName,
            university: '',
            logo: `https://api.dicebear.com/7.x/identicon/svg?seed=team-${id}`,
            code: `${prefix}-${suffix}`,
            members: [],
            isPlaceholder: true
        });
    }

    return newTeams;
}

// Check if a team is complete
export function isTeamProfileComplete(team: Team): boolean {
    if (!team) return false;
    return !team.isPlaceholder && !!team.name && !!team.university && team.members.length > 0;
}
