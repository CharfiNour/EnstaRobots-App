"use client";

import { useEffect } from 'react';
import { syncEventDayStatusFromSupabase, updateCompetitionState } from '@/lib/competitionState';
import { subscribeToAppSettings } from '@/lib/appSettings';
import { supabase } from '@/lib/supabase';

/**
 * Global provider for synchronizing application state with Supabase Realtime.
 * This should be placed at the root layout to ensure it stays active even when
 * sub-pages are restricted or loading.
 */
export default function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // 1. Initial Sync
        syncEventDayStatusFromSupabase();

        // 2. Subscribe to App Settings (Global Toggles)
        const appSettingsChannel = subscribeToAppSettings((settings) => {
            console.log('⚡ [REALTIME] App settings updated:', settings);
            updateCompetitionState({
                eventDayStarted: settings.event_day_started,
                profilesLocked: settings.profiles_locked
            });
        });

        // 3. Subscribe to Live Sessions (Current Matches)
        const liveSessionsChannel = supabase
            .channel('global-live-sessions')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'live_sessions' },
                async () => {
                    console.log('⚡ [REALTIME] Live session change detected');
                    const { fetchLiveSessionsFromSupabase } = await import('@/lib/supabaseData');
                    const sessions = await fetchLiveSessionsFromSupabase();
                    updateCompetitionState({ liveSessions: sessions });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(appSettingsChannel);
            supabase.removeChannel(liveSessionsChannel);
        };
    }, []);

    return <>{children}</>;
}
