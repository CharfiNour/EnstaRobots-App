export interface TeamMember {
    name: string;
    role: string;
    isLeader?: boolean;
}

export interface Competition {
    id: string;
    type?: string;
    name?: string;
    description?: string;
    status?: string;
    totalTeams?: number;
    totalMatches?: number;
    arena?: string;
    schedule?: string;
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
    group?: string;
    displayOrder?: number;
}

const INITIAL_TEAMS: Team[] = [];

const TEAMS_STORAGE_KEY = 'enstarobots_teams_v1';

export function getTeams(): Team[] {
    if (typeof window === 'undefined') return INITIAL_TEAMS;

    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!stored) return INITIAL_TEAMS;

    try {
        const teams = JSON.parse(stored);

        // Simple deduplication and sanity check + strict "dead data" filtering
        const seen = new Set();
        return teams.filter((team: Team) => {
            if (!team || !team.id || seen.has(team.id)) return false;

            // Silently ignore dead placeholder data (Aggressive check)
            const teamName = String(team.name || '').toUpperCase();
            const robotName = String(team.robotName || '').toUpperCase();
            const clubName = String(team.club || '').toUpperCase();

            const isTeam42 = /TEAM\s*[-–—]?\s*42/.test(teamName) || /TEAM\s*[-–—]?\s*42/.test(robotName);
            const isUnknownClub = clubName.includes('UNKNOWN') || teamName.includes('UNKNOWN');
            const isDummySlot = team.isPlaceholder && (teamName === 'SLOT' || !team.competition);

            if (isTeam42 || isUnknownClub || isDummySlot) return false;

            seen.add(team.id);
            return true;
        });
    } catch {
        return INITIAL_TEAMS;
    }
}


export function saveTeams(teams: Team[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    window.dispatchEvent(new Event('teams-updated'));
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
