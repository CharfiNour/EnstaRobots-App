# Data Caching System

## Overview

The app now includes an intelligent caching layer that significantly improves performance by reducing redundant Supabase API calls. Data is cached in memory with configurable Time-To-Live (TTL) values.

## How It Works

### Cache TTLs (Time-To-Live)

Different data types have different cache durations based on how frequently they change:

- **Competitions**: 60 seconds (rarely changes)
- **Teams**: 30 seconds (moderate changes)
- **Scores**: 10 seconds (frequent updates)
- **Live Sessions**: 5 seconds (very frequent updates)

### Automatic Cache Management

1. **Cache Hit**: When you request data, the cache is checked first. If valid cached data exists, it's returned immediately (no network request).

2. **Cache Miss**: If no cached data exists or it's expired, a fresh fetch is made from Supabase and the result is cached.

3. **Cache Invalidation**: When data is modified (create, update, delete), the relevant cache is automatically invalidated to ensure fresh data on the next fetch.

## Usage

### Direct Usage (Existing Code)

All existing Supabase fetch functions now automatically use caching:

```typescript
import { fetchCompetitionsFromSupabase, fetchTeamsFromSupabase, fetchScoresFromSupabase } from '@/lib/supabaseData';

// These now automatically use caching
const competitions = await fetchCompetitionsFromSupabase();
const teams = await fetchTeamsFromSupabase('full');
const scores = await fetchScoresFromSupabase();
```

### Using the Custom Hook (Recommended for New Code)

For React components, use the `useCachedData` hook for better UX:

```typescript
import { useCachedData } from '@/lib/useCachedData';
import { fetchCompetitionsFromSupabase } from '@/lib/supabaseData';
import { cacheKeys } from '@/lib/dataCache';

function MyComponent() {
    const { data: competitions, loading, error, refetch } = useCachedData(
        fetchCompetitionsFromSupabase,
        cacheKeys.competitions(),
        {
            refreshInterval: 30000, // Auto-refresh every 30 seconds
        }
    );

    if (loading && !competitions) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            {/* Cached data is shown immediately */}
            {competitions?.map(comp => <div key={comp.id}>{comp.name}</div>)}
            
            {/* Manual refresh button */}
            <button onClick={refetch}>Refresh</button>
        </div>
    );
}
```

### Manual Cache Control

If you need to manually control the cache:

```typescript
import { dataCache, cacheKeys } from '@/lib/dataCache';

// Invalidate specific cache
dataCache.invalidate(cacheKeys.competitions());

// Invalidate all caches matching a pattern
dataCache.invalidatePattern('teams'); // Invalidates both 'teams:minimal' and 'teams:full'

// Clear all cache
dataCache.clear();

// Get cache statistics (for debugging)
const stats = dataCache.getStats();
console.log('Cache stats:', stats);
```

## Benefits

### 🚀 Performance Improvements

- **Instant Data**: Cached data is returned immediately (no network latency)
- **Reduced API Calls**: Fewer requests to Supabase = faster app
- **Background Refresh**: Fresh data is fetched in the background while showing cached data
- **Bandwidth Savings**: Less data transferred over the network

### 💡 User Experience

- **No Loading Spinners**: Users see data instantly from cache
- **Smooth Navigation**: Switching between pages feels instant
- **Real-time Feel**: Auto-refresh keeps data current without manual refreshes

### 🔧 Developer Experience

- **Zero Config**: Existing code automatically benefits from caching
- **Smart Invalidation**: Cache is automatically cleared when data changes
- **Easy Debugging**: Console logs show cache hits/misses with emoji indicators:
  - 📦 = Cache Hit
  - 💾 = Cache Set

## Console Logs

Watch the browser console to see caching in action:

```
📦 [CACHE HIT] Competitions loaded from cache
💾 [CACHE SET] Teams (full) cached
📦 [CACHE HIT] Scores loaded from cache
```

## Best Practices

1. **Use the Hook**: For React components, prefer `useCachedData` over direct fetch calls
2. **Set Refresh Intervals**: For frequently changing data, use auto-refresh
3. **Monitor Cache**: Check console logs to ensure caching is working as expected
4. **Invalidate on Mutations**: Cache is automatically invalidated, but you can manually invalidate if needed

## Technical Details

### Cache Structure

```typescript
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}
```

### Cache Keys

```typescript
cacheKeys.competitions()      // 'competitions:all'
cacheKeys.teams('full')       // 'teams:full'
cacheKeys.teams('minimal')    // 'teams:minimal'
cacheKeys.scores()            // 'scores:all'
cacheKeys.liveSessions()      // 'liveSessions:all'
```

## Future Enhancements

Potential improvements for the caching system:

- [ ] Persistent cache (localStorage/IndexedDB)
- [ ] Cache size limits
- [ ] LRU (Least Recently Used) eviction
- [ ] Per-item TTL configuration
- [ ] Cache warming strategies
- [ ] Optimistic updates
