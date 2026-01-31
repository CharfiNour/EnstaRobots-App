import { supabase } from './supabase';
import { UserRole } from './navConfig';

export interface AuthSession {
    userId: string;
    role: UserRole;
    teamId?: string;
    teamCode?: string;
    teamName?: string;
    clubName?: string; // For club-wide login
    competition?: string; // For juries locked to a specific competition
    expiresAt: number;
}

// Cookie name
const SESSION_COOKIE = 'enstarobots_session';

/**
 * COOKIE HELPERS
 */
function setCookie(name: string, value: string, days: number) {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Max-Age=-99999999;path=/;SameSite=Lax`;
}

// Team Auth: Login with team code
import { getTeams } from './teams';

export async function loginWithStaffCode(code: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    if (typeof window === 'undefined') return { success: false, error: 'Client side only' };

    try {
        const trimmedCode = code.trim().toUpperCase();

        const { data, error } = await supabase
            .from('staff_codes')
            .select('id, role, competition_id, name')
            .eq('code', trimmedCode)
            .maybeSingle();

        if (error) {
            console.error('Login Error (Supabase):', error);
            return { success: false, error: 'Database error' };
        }

        if (!data) {
            return { success: false, error: 'Invalid or inactive access code' };
        }

        const staffData = data as any;

        const session: AuthSession = {
            userId: staffData.id,
            role: (staffData.role === 'team' ? 'team' : staffData.role) as UserRole,
            clubName: staffData.role === 'team' ? staffData.name : undefined,
            competition: (staffData.role === 'jury' || staffData.role === 'homologation_jury') && staffData.competition_id ? staffData.competition_id : undefined,
            expiresAt: Date.now() + 12 * 60 * 60 * 1000,
        };

        setCookie(SESSION_COOKIE, JSON.stringify(session), 1);
        return { success: true, session };

    } catch (err) {
        return { success: false, error: 'Login processing failed' };
    }
}

export async function loginWithTeamCode(teamCode: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
        const trimmedCode = teamCode.trim().toUpperCase();

        const { data: staffCode } = await supabase
            .from('staff_codes')
            .select('id, role, name')
            .eq('code', trimmedCode)
            .eq('role', 'team')
            .maybeSingle();

        if (staffCode) {
            const sc = staffCode as any;
            const session: AuthSession = {
                userId: sc.id,
                role: 'team',
                clubName: sc.name,
                teamCode: trimmedCode,
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            };

            setCookie(SESSION_COOKIE, JSON.stringify(session), 7);
            return { success: true, session };
        }

        const { data: team, error } = await supabase
            .from('teams')
            .select('id, name, team_code, competition_id, club')
            .eq('team_code', trimmedCode)
            .single();

        if (error || !team) {
            return { success: false, error: 'Invalid access code' };
        }

        const teamData = team as any;

        const session: AuthSession = {
            userId: teamData.id,
            role: 'team',
            teamId: teamData.id,
            teamCode: teamData.team_code,
            teamName: teamData.name,
            clubName: teamData.club || undefined,
            competition: teamData.competition_id || undefined,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };

        setCookie(SESSION_COOKIE, JSON.stringify(session), 7);
        return { success: true, session };
    } catch (err) {
        return { success: false, error: 'Login failed. Please try again.' };
    }
}

// Get current session
export function getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;

    const sessionStr = getCookie(SESSION_COOKIE);
    if (!sessionStr) return null;

    try {
        const session: AuthSession = JSON.parse(decodeURIComponent(sessionStr));

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
        eraseCookie(SESSION_COOKIE);
        window.location.href = '/';
    }
}

// Check if user has access to a route
export function hasAccess(requiredRole: UserRole): boolean {
    const currentRole = getUserRole();
    if (requiredRole === 'visitor') return true;

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

        setCookie(SESSION_COOKIE, JSON.stringify(session), 7);
        return { success: true, session };
    } catch (err) {
        return { success: false, error: 'Login failed. Please try again.' };
    }
}
