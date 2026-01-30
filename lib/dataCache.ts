/**
 * Data Cache Manager
 * Provides in-memory caching for Supabase data to reduce network requests
 * and improve app performance
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class DataCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL = 30000; // 30 seconds default

    // keys that should be persisted to disk for "Instant Load" next time
    // We do NOT persist scores because they change too fast and are heavy.
    // We disable disk persistence to prevent stale data issues across devices/modes.
    // The whitelist is now empty, but we keep the list locally to clean up old data.
    private legacyPersistenceKeys = ['competitions:full', 'competitions:minimal', 'teams:full', 'teams:minimal', 'competitions:all', 'teams:all'];
    private persistenceWhitelist: string[] = [];

    // Different TTLs for different data types
    private ttlConfig = {
        competitions: 60000 * 60, // 1 hour (memory only)
        teams: 60000 * 5,        // 5 minutes (memory only)
        scores: 10000,           // 10 seconds (memory only)
        liveSessions: 5000,      // 5 seconds (memory only)
    };

    constructor() {
        if (typeof window !== 'undefined') {
            this.clearLegacyStorage();
        }
    }

    /**
     * Clean up any old localized data to ensure fresh state
     */
    private clearLegacyStorage() {
        if (typeof window === 'undefined') return;

        this.legacyPersistenceKeys.forEach(key => {
            try {
                localStorage.removeItem(`datacache_${key}`);
            } catch (e) {
                // Ignore
            }
        });
        console.log('🧹 [CACHE] Legacy disk cache cleared');
    }

    /**
     * Get data from cache if valid, otherwise return null
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set data in cache with optional custom TTL
     */
    set<T>(key: string, data: T, customTTL?: number): void {
        const ttl = customTTL || this.getTTLForKey(key);
        const timestamp = Date.now();

        const entry = {
            data,
            timestamp,
            expiresAt: timestamp + ttl
        };

        this.cache.set(key, entry);
        // Memory only - no disk write
    }

    /**
     * Invalidate specific cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`datacache_${key}`);
        }
    }

    /**
     * Invalidate all cache entries matching a pattern
     */
    invalidatePattern(pattern: string): void {
        const keys = Array.from(this.cache.keys());
        keys.forEach(key => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                if (typeof window !== 'undefined') {
                    // Try to clean up local storage too
                    // Note: This is an approximation since we don't have list of all storage keys easily
                    // But for known keys in whitelist:
                    this.persistenceWhitelist.forEach(pKey => {
                        if (pKey.includes(pattern)) {
                            localStorage.removeItem(`datacache_${pKey}`);
                        }
                    });
                }
            }
        });
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        if (typeof window !== 'undefined') {
            this.persistenceWhitelist.forEach(key => localStorage.removeItem(`datacache_${key}`));
        }
    }

    /**
     * Get TTL based on key pattern
     */
    private getTTLForKey(key: string): number {
        if (key.includes('competitions')) return this.ttlConfig.competitions;
        if (key.includes('teams')) return this.ttlConfig.teams;
        if (key.includes('scores')) return this.ttlConfig.scores;
        if (key.includes('liveSessions')) return this.ttlConfig.liveSessions;
        return this.defaultTTL;
    }

    /**
     * Get cache statistics for debugging
     */
    getStats() {
        const now = Date.now();
        let valid = 0;
        let expired = 0;

        this.cache.forEach(entry => {
            if (now > entry.expiresAt) {
                expired++;
            } else {
                valid++;
            }
        });

        return {
            total: this.cache.size,
            valid,
            expired,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const dataCache = new DataCache();

// Helper to create cache keys
export const cacheKeys = {
    competitions: (fields: 'minimal' | 'full' = 'full') => `competitions:${fields}`,
    teams: (fields: 'minimal' | 'full' = 'full') => `teams:${fields}`,
    teamDetail: (id: string) => `team_detail:${id}`,
    scores: () => 'scores:all',
    liveSessions: () => 'liveSessions:all',
};
