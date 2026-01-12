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
const STAFF_CODES_KEY = 'enstarobots_staff_codes';

// Team Auth: Login with team code
import { getTeams } from './teams';

export async function loginWithStaffCode(code: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    if (typeof window === 'undefined') return { success: false, error: 'Client side only' };

    try {
        const trimmedCode = code.trim().toUpperCase();

        // Fetch staff codes from local storage
        const stored = localStorage.getItem(STAFF_CODES_KEY);
        let staffCodes: any[] = [];

        if (stored) {
            staffCodes = JSON.parse(stored);
        } else {
            // Default fallback if storage is empty (should match StaffCodesTab defaults)
            staffCodes = [
                { id: '1', role: 'admin', name: 'Master Admin', code: 'ADMIN-2024' },
                { id: '2', role: 'jury', name: 'Main Jury', code: 'JURY-2024' },
            ];
        }

        const match = staffCodes.find(s => s.code === trimmedCode);

        if (!match) {
            return { success: false, error: 'Invalid access code' };
        }

        const session: AuthSession = {
            userId: match.id,
            role: match.role,
            competition: match.role === 'jury' ? match.competition : undefined,
            expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { success: true, session };

    } catch (err) {
        return { success: false, error: 'Login processing failed' };
    }
}

export async function loginWithTeamCode(teamCode: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
        const trimmedCode = teamCode.trim().toUpperCase();

        // 1. Check local storage teams (Primary for this demo/local setup)
        const localTeams = getTeams();
        const localMatch = localTeams.find(t => t.code?.toUpperCase() === trimmedCode);

        if (localMatch) {
            const session: AuthSession = {
                userId: localMatch.id,
                role: 'team',
                teamId: localMatch.id,
                teamCode: localMatch.code,
                teamName: localMatch.name,
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            };
            if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return { success: true, session };
        }

        // 2. Fallback to Supabase if not found locally
        const { data: team, error } = await (supabase
            .from('teams')
            .select('id, name, code, competition_id')
            .eq('code', trimmedCode)
            .single() as any);

        if (error || !team) {
            return { success: false, error: 'Invalid team code' };
        }

        const session: AuthSession = {
            userId: team.id,
            role: 'team',
            teamId: team.id,
            teamCode: team.code,
            teamName: team.name,
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
