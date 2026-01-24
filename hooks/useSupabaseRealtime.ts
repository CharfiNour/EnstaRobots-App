"use client";

import { useEffect, useRef } from 'react';
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
    const callbackRef = useRef(callback);

    // Keep callback updated without triggering re-subscription
    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {
        // Create a unique channel for this subscription
        const channel = supabase
            .channel(`public:${table}-${Math.random().toString(36).substring(7)}`)
            .on(
                'postgres_changes' as any,
                { event, schema: 'public', table },
                (payload: any) => {
                    callbackRef.current(payload);
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, event]);
}
