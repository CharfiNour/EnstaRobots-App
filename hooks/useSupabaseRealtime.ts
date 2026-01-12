"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook to subscribe to Supabase Realtime changes
 * @param table The table name to subscribe to
 * @param callback The callback function to run on events
 * @param event The event type to listen for (INSERT, UPDATE, DELETE, or *)
 */
export function useSupabaseRealtime(
    table: string,
    callback: (payload: any) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
    useEffect(() => {
        // Create a unique channel for this subscription
        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes' as any,
                { event, schema: 'public', table },
                (payload: any) => {
                    callback(payload);
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, event, callback]);
}
