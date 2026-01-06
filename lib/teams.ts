export interface TeamMember {
    name: string;
    role: string;
}

export interface Team {
    id: string;
    name: string;
    club: string;
    university: string;
    logo: string;
    photo?: string;
    members: TeamMember[];
}

const INITIAL_TEAMS: Team[] = [
    {
        id: '1',
        name: 'RoboKnights',
        club: 'Robotics Club A',
        university: 'Science University',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RoboKnights',
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
        photo: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=800',
        members: [
            { name: 'Frank Castle', role: 'Leader' },
            { name: 'Grace Hopper', role: 'Strategist' },
        ]
    }
];

const TEAMS_STORAGE_KEY = 'enstarobots_teams_v1';

export function getTeams(): Team[] {
    if (typeof window === 'undefined') return INITIAL_TEAMS;

    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!stored) {
        // Initialize if empty
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(INITIAL_TEAMS));
        return INITIAL_TEAMS;
    }

    try {
        return JSON.parse(stored);
    } catch {
        return INITIAL_TEAMS;
    }
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
