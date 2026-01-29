import { useEffect, useState, useCallback } from 'react';
import { dataCache } from './dataCache';

/**
 * Custom hook for cached data with automatic refresh
 * Provides cached data immediately and fetches fresh data in the background
 */
export function useCachedData<T>(
    fetchFunction: () => Promise<T>,
    cacheKey: string,
    options: {
        refreshInterval?: number; // Auto-refresh interval in ms (0 = no auto-refresh)
        dependencies?: any[]; // Dependencies that trigger refetch
    } = {}
) {
    const { refreshInterval = 0, dependencies = [] } = options;
    const [data, setData] = useState<T | null>(() => dataCache.get<T>(cacheKey));
    const [loading, setLoading] = useState<boolean>(!data);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);

            const result = await fetchFunction();
            setData(result);

            // Cache is already updated by the fetch function itself
            // No need to manually cache here
        } catch (err) {
            console.error(`Error fetching data for ${cacheKey}:`, err);
            setError(err as Error);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [fetchFunction, cacheKey]);

    // Initial fetch
    useEffect(() => {
        // If we have cached data, fetch in background without showing loading
        if (data) {
            fetchData(false);
        } else {
            fetchData(true);
        }
    }, [fetchData, ...dependencies]);

    // Auto-refresh interval
    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(() => {
                fetchData(false); // Background refresh
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [refreshInterval, fetchData]);

    const refetch = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch
    };
}
