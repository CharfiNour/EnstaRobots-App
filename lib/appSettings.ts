/**
 * App Settings Service
 * Manages global application configuration stored in the app_settings table
 */

import { supabase } from './supabase';

export interface AppSettings {
    id: string;
    event_day_started: boolean;
    profiles_locked: boolean;
    total_competitions?: number;
    total_teams?: number;
    total_matches?: number;
    event_duration?: string;
    updated_at: string;
    created_at: string;
}

/**
 * Update global dashboard stats (admin only)
 */
export async function updateDashboardStats(stats: Partial<AppSettings>): Promise<boolean> {
    try {
        // 1. Check if row exists
        const { data: existing, error: fetchError } = await (supabase
            .from('app_settings' as any) as any)
            .select('id')
            .eq('id', 'global')
            .maybeSingle();

        if (fetchError) {
            console.warn('[APP SETTINGS] Pre-save fetch error:', fetchError.message);
        }

        if (!existing) {
            // 2. Create row if missing
            const { error: insertError } = await (supabase
                .from('app_settings' as any) as any)
                .insert({
                    id: 'global',
                    event_day_started: false,
                    profiles_locked: false,
                    total_competitions: 0,
                    total_teams: 0,
                    total_matches: 0,
                    event_duration: 'TBD',
                    ...stats,
                    updated_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('[APP SETTINGS] Row creation failed:', insertError.message);
                return false;
            }
            return true;
        }

        // 3. Update existing row
        const { error: updateError } = await (supabase
            .from('app_settings' as any) as any)
            .update({
                ...stats,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'global');

        if (updateError) {
            if (updateError.message?.includes('column')) {
                console.error('❌ [APP SETTINGS] SCHEMA MISMATCH: Your database is missing columns. Please run the SQL fix script in: supabase/FIX_APP_SETTINGS_SCHEMA.sql');
            } else {
                console.error('[APP SETTINGS] Update error:', updateError.message);
            }
            return false;
        }

        return true;
    } catch (e: any) {
        console.error('[APP SETTINGS] Exception in updateDashboardStats:', e.message || e);
        return false;
    }
}

/**
 * Fetch global app settings from Supabase
 */
export async function fetchAppSettings(): Promise<AppSettings | null> {
    try {
        const { data, error } = await (supabase
            .from('app_settings' as any) as any)
            .select('*')
            .eq('id', 'global')
            .maybeSingle();

        if (error) {
            console.warn('[APP SETTINGS] Fetch error:', error.message);
            return null;
        }

        if (!data) {
            // If row is missing, return a default object but don't assume null is failure
            return {
                id: 'global',
                event_day_started: false,
                profiles_locked: false,
                total_competitions: 0,
                total_teams: 0,
                total_matches: 0,
                event_duration: 'TBD',
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };
        }

        return data as AppSettings;
    } catch (e: any) {
        console.error('[APP SETTINGS] Critical fetch error:', e?.message || e);
        return null;
    }
}

/**
 * Update Event Day status in app_settings (admin only)
 */
export async function updateEventDayStatus(started: boolean): Promise<boolean> {
    console.log(`[APP SETTINGS] Updating event_day_started to: ${started ? 'LIVE' : 'CLOSED'}`);

    try {
        const { error } = await (supabase
            .from('app_settings' as any) as any)
            .update({
                event_day_started: started,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'global');

        if (error) {
            console.error('❌ [APP SETTINGS ERROR] Event Day Update Failed:', error);
            return false;
        }

        console.log(`✅ [APP SETTINGS SUCCESS] Event Day is now: ${started ? 'LIVE' : 'CLOSED'}`);
        return true;
    } catch (e) {
        console.error('[APP SETTINGS] Critical update error:', e);
        return false;
    }
}

/**
 * Update Profiles Lock status in app_settings (admin only)
 */
export async function updateProfilesLock(locked: boolean): Promise<boolean> {
    console.log(`[APP SETTINGS] Updating profiles_locked to: ${locked}`);

    try {
        const { error } = await (supabase
            .from('app_settings' as any) as any)
            .update({
                profiles_locked: locked,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'global');

        if (error) {
            console.error('❌ [APP SETTINGS ERROR] Profiles Lock Update Failed:', error);
            return false;
        }

        console.log(`✅ [APP SETTINGS] Profiles lock updated to: ${locked}`);
        return true;
    } catch (e) {
        console.error('[APP SETTINGS] Critical profiles lock error:', e);
        return false;
    }
}

/**
 * Subscribe to app_settings changes (realtime)
 */
export function subscribeToAppSettings(callback: (settings: Partial<AppSettings>) => void) {
    const channel = supabase
        .channel('app-settings-changes')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'app_settings',
                filter: 'id=eq.global'
            },
            (payload) => {
                console.log('⚡ [APP SETTINGS] Realtime update:', payload.new);
                callback(payload.new as Partial<AppSettings>);
            }
        )
        .subscribe();

    return channel;
}
