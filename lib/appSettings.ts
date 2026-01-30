/**
 * App Settings Service
 * Manages global application configuration stored in the app_settings table
 */

import { supabase } from './supabase';

export interface AppSettings {
    id: string;
    event_day_started: boolean;
    profiles_locked: boolean;
    updated_at: string;
    created_at: string;
}

/**
 * Fetch global app settings from Supabase
 */
export async function fetchAppSettings(): Promise<AppSettings | null> {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 'global')
            .single();

        if (error) {
            console.error('[APP SETTINGS] Fetch error:', error);
            return null;
        }

        return data as AppSettings;
    } catch (e) {
        console.error('[APP SETTINGS] Critical fetch error:', e);
        return null;
    }
}

/**
 * Update Event Day status in app_settings (admin only)
 */
export async function updateEventDayStatus(started: boolean): Promise<boolean> {
    console.log(`[APP SETTINGS] Updating event_day_started to: ${started ? 'LIVE' : 'CLOSED'}`);

    try {
        const { data, error } = await (supabase
            .from('app_settings') as any)
            .update({ event_day_started: started })
            .eq('id', 'global')
            .select();

        if (error) {
            console.error('❌ [APP SETTINGS ERROR]', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
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
            .from('app_settings') as any)
            .update({ profiles_locked: locked })
            .eq('id', 'global');

        if (error) {
            console.error('[APP SETTINGS] Profiles lock error:', error);
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
