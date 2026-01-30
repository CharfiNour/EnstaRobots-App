import { supabase } from './supabase';
import { UserRole } from './navConfig';

export interface AuthSession {
    userId: string;
    role: UserRole;
    teamId?: string;
    teamCode?: string;
    teamName?: string;
    competition?: string; // For juries locked to a specific competition
    expiresAt: number;
}

// Local storage keys
const SESSION_KEY = 'enstarobots_session';

// Team Auth: Login with team code
import { getTeams } from './teams';

export async function loginWithStaffCode(code: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    if (typeof window === 'undefined') return { success: false, error: 'Client side only' };

    try {
        const trimmedCode = code.trim().toUpperCase();

        const { data, error } = await supabase
            .from('staff_codes')
            .select('id, role, competition_id')
            .eq('code', trimmedCode)
            .maybeSingle();

        if (error) {
            console.error('Login Error (Supabase):', error);
            console.error('Attempted Code:', trimmedCode);
            return { success: false, error: 'Database error' };
        }

        if (!data) {
            console.warn('Login Failed: No match found for code', trimmedCode);
            return { success: false, error: 'Invalid or inactive access code' };
        }

        // Type assertion for staff code data
        const staffData = data as { id: string; role: string; competition_id: string | null };

        const session: AuthSession = {
            userId: staffData.id,
            role: staffData.role as UserRole,
            competition: (staffData.role === 'jury' || staffData.role === 'homologation_jury') && staffData.competition_id ? staffData.competition_id : undefined,
            expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { success: true, session };

    } catch (err) {
        console.error('Login Exception:', err);
        return { success: false, error: 'Login processing failed' };
    }
}

export async function loginWithTeamCode(teamCode: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
        const trimmedCode = teamCode.trim().toUpperCase();

        // Query team code from Supabase
        const { data: team, error } = await supabase
            .from('teams')
            .select('id, name, team_code, competition_id')
            .eq('team_code', trimmedCode)
            .single();

        if (error || !team) {
            return { success: false, error: 'Invalid team code' };
        }

        const teamData = team as any; // Explicit cast

        const session: AuthSession = {
            userId: teamData.id,
            role: 'team',
            teamId: teamData.id,
            teamCode: teamData.team_code,
            teamName: teamData.name,
            competition: teamData.competition_id || undefined,
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
        jury: 2,
        homologation_jury: 2,
        admin: 3,
    };

    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
}

// Admin/Jury login (placeholder for Supabase Auth)
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
        const { data: profile } = await (supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single() as any);

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
