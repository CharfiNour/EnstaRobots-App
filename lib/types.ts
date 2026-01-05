// Database Schema Types
// These types reflect the structure of data from Supabase
// Keep mock data aligned with these types to avoid refactoring

export interface Competition {
    id: string;
    title: string;
    category: 'junior_line_follower' | 'junior_all_terrain' | 'line_follower' | 'all_terrain' | 'fight';
    status: 'upcoming' | 'qualifiers' | 'group_stage' | 'knockout' | 'finals' | 'completed';
    description?: string;
    total_teams: number;
    total_matches: number;
    arena_ids: string[];
    start_date: string;
    end_date: string;
    created_at: string;
}

export interface Team {
    id: string;
    name: string;
    team_code: string; // Used for auth
    competition_id: string;
    robot_name?: string;
    school?: string;
    members?: string[];
    created_at: string;
}

export interface Arena {
    id: string;
    name: string; // e.g., "Arena 1"
    location?: string;
    active: boolean;
}

export interface Match {
    id: string;
    competition_id: string;
    round: string; // e.g., "Qualifiers", "Semi-Finals", "Finals"
    arena_id: string;
    team1_id: string;
    team2_id: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    scheduled_time?: string;
    start_time?: string;
    end_time?: string;
    winner_id?: string;
    created_at: string;
}

export interface Score {
    id: string;
    match_id: string;
    team_id: string;

    // For Line Follower & All Terrain
    time_ms?: number;
    penalties?: number;
    bonus_points?: number;

    // For Fight
    knockouts?: number;
    judge_points?: number;
    damage_score?: number;

    // Calculated
    total_points: number;

    judge_id?: string; // Who scored this
    created_at: string;
}

export interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    competition_id?: string; // null = global announcement
    visible_to: 'all' | 'teams' | 'judges' | 'admins';
    created_at: string;
    expires_at?: string;
}

export interface Profile {
    id: string; // matches auth.users.id
    email?: string;
    role: 'admin' | 'judge';
    full_name?: string;
    assigned_competitions?: string[]; // For judges
    created_at: string;
}

// Ranking computed view or materialized query result
export interface Ranking {
    team_id: string;
    team_name: string;
    competition_id: string;
    rank: number;
    total_points: number;
    wins: number;
    losses: number;
    trend: 'up' | 'down' | 'same';
}
