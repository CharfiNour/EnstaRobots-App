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

const INITIAL_TEAMS: Team[] = [
    {
        id: '1',
        name: 'RoboKnights',
        club: 'Robotics Club A',
        university: 'Science University',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RoboKnights',
        code: 'RK-2024-X1',
        competition: 'line_follower',
        photo: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?auto=format&fit=crop&q=80&w=800',
        members: [
            { name: 'Alice Smith', role: 'Leader' },
            { name: 'Bob Johnson', role: 'Engineer' },
            { name: 'Charlie Brown', role: 'Programmer' },
        ]
    },
    {
        id: '2',
        name: 'CyberDragons',
        club: 'Tech Hub',
        university: 'Institute of Technology',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=CyberDragons',
        code: 'CD-2024-Y2',
        competition: 'all_terrain',
        photo: 'https://images.unsplash.com/photo-1581092120527-df75275e7443?auto=format&fit=crop&q=80&w=800',
        members: [
            { name: 'David Wilson', role: 'Leader' },
            { name: 'Eva Green', role: 'Designer' },
        ]
    },
    {
        id: '3',
        name: 'Steel Panthers',
        club: 'Future Makers',
        university: 'Global University',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SteelPanthers',
        code: 'SP-2024-Z3',
        competition: 'fight',
        photo: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=800',
        members: [
            { name: 'Frank Castle', role: 'Leader' },
            { name: 'Grace Hopper', role: 'Strategist' },
        ]
    },
    {
        id: '4',
        name: 'Line Masters',
        club: 'Speed Club',
        university: 'Tech University',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=LineMasters',
        code: 'LM-2024-Q4',
        competition: 'line_follower',
        members: [{ name: 'John Doe', role: 'Leader' }]
    }
];

const TEAMS_STORAGE_KEY = 'enstarobots_teams_v1';

export function getTeams(): Team[] {
    if (typeof window === 'undefined') return INITIAL_TEAMS;

    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    let teams = INITIAL_TEAMS;

    if (stored) {
        try {
            teams = JSON.parse(stored);
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

    if (uniqueTeams.length !== teams.length) {
        saveTeams(uniqueTeams);
    }

    return uniqueTeams;
}

export function saveTeams(teams: Team[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
}

// Helper to update team order
export function reorderTeams(startIndex: number, endIndex: number): Team[] {
    const teams = getTeams();
    const result = Array.from(teams);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    saveTeams(result);
    return result;
}

// Generate a specific number of team slots
export function generateEmptyTeams(count: number): Team[] {
    const currentTeams = getTeams();
    const newTeams: Team[] = [...currentTeams];

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

    saveTeams(newTeams);
    return newTeams;
}

/**
 * Adds a specific number of team slots for a given club.
 * The codes will have the club name (first 3-4 chars) as a prefix.
 */
export function addClubSlots(clubName: string, count: number): Team[] {
    const currentTeams = getTeams();
    const newTeams: Team[] = [...currentTeams];

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

    saveTeams(newTeams);
    return newTeams;
}

// Update a specific team
export function updateTeam(id: string, data: Partial<Team>): void {
    const teams = getTeams();
    const index = teams.findIndex(t => t.id === id);
    if (index !== -1) {
        teams[index] = { ...teams[index], ...data, isPlaceholder: false };
        saveTeams(teams);
    }
}

// Update logo for all teams in a club
export function updateClubLogo(clubName: string, logoUrl: string): void {
    const teams = getTeams();
    const updatedTeams = teams.map(t => {
        if (t.club === clubName) {
            return { ...t, logo: logoUrl };
        }
        return t;
    });
    saveTeams(updatedTeams);
}

// Check if a team is complete
export function isTeamProfileComplete(teamId: string): boolean {
    const teams = getTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;
    return !team.isPlaceholder && !!team.name && !!team.university && team.members.length > 0;
}