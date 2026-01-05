import { supabase } from './supabase';
import { UserRole } from './navConfig';

export interface AuthSession {
    userId: string;
    role: UserRole;
    teamId?: string;
    teamCode?: string;
    teamName?: string;
    expiresAt: number;
}

// Local storage keys
const SESSION_KEY = 'enstarobots_session';

// Team Auth: Login with team code
export async function loginWithTeamCode(teamCode: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
        // Query teams table for matching team code
        const { data: team, error } = await supabase
            .from('teams')
            .select('id, name, team_code, competition_id')
            .eq('team_code', teamCode.trim())
            .single();

        if (error || !team) {
            return { success: false, error: 'Invalid team code' };
        }

        // Create session
        const session: AuthSession = {
            userId: team.id,
            role: 'team',
            teamId: team.id,
            teamCode: team.team_code,
            teamName: team.name,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        // Store in localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }

        return { success: true, session };
    } catch (err) {
        return { success: false, error: 'Login failed. Please try again.' };
    }
}

// Get current session
export function getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;

    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    try {
        const session: AuthSession = JSON.parse(sessionStr);

        // Check if expired
        if (session.expiresAt < Date.now()) {
            logout();
            return null;
        }

        return session;
    } catch {
        return null;
    }
}

// Get current user role
export function getUserRole(): UserRole {
    const session = getSession();
    return session?.role || 'visitor';
}

// Logout
export function logout() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = '/';
    }
}

// Check if user has access to a route
export function hasAccess(requiredRole: UserRole): boolean {
    const currentRole = getUserRole();

    if (requiredRole === 'visitor') return true;

    // Check role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
        visitor: 0,
        team: 1,
        judge: 2,
        admin: 3,
    };

    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
}

// Admin/Judge login (placeholder for Supabase Auth)
export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Get profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();

        if (!profile) {
            return { success: false, error: 'Profile not found' };
        }

        const session: AuthSession = {
            userId: data.user.id,
            role: profile.role as UserRole,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };

        if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }

        return { success: true, session };
    } catch (err) {
        return { success: false, error: 'Login failed. Please try again.' };
    }
}
