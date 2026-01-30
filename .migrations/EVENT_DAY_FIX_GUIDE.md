# Event Day Toggle - Debugging & Fix Guide

## Current Issue
The toggle button isn't writing to the database. Console shows:
- ✅ `[SYNC] Event Day status from Supabase: false` (READ works)
- ❌ No `[EVENT DAY SYNC]` or `[TOGGLE EVENT DAY]` logs (WRITE not triggered)

## Immediate Debugging Steps

### Step 1: Test if the button is being clicked
1. Push the latest changes with the new logging:
   ```bash
   git add .
   git commit -m "debug: add toggle event day logging"
   git push origin main
   ```

2. Go to the Admin Teams page and click the "Event Day Live" toggle
3. Check console - you should see **ONE** of these:

   **If you see this:**
   ```
   🔄 [TOGGLE EVENT DAY] CLOSED → LIVE
   [EVENT DAY SYNC] Updating event status. Role: admin New state: LIVE
   ```
   → Button IS being clicked, but write is failing (go to Step 2)

   **If you see NOTHING:**
   → Button click handler isn't working (check if you're logged in as admin)

### Step 2: Check Supabase for errors
If the toggle function IS being called, check the console for:

```
❌ [EVENT DAY SYNC ERROR] {
  code: "...",
  message: "...",
  details: "...",
  hint: "..."
}
```

Common errors:
- **`PGRST301`** or **`42501`**: RLS policy blocking the update
- **`42703`**: Column `event_day_started` doesn't exist
- **`08P01`**: No rows matched the UPDATE query

### Step 3: Verify Database Schema
Go to Supabase → Table Editor → `competitions`

Check if the column exists:
- Column name: `event_day_started`
- Type: `boolean`
- Default: `false`

**If it doesn't exist**, add it:
```sql
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS event_day_started BOOLEAN NOT NULL DEFAULT FALSE;
```

### Step 4: Check RLS Policies
Go to Supabase → Authentication → Policies → `competitions` table

You need a policy like:
```sql
Policy name: Enable write for authenticated users
Operation: UPDATE
Target roles: authenticated
USING clause: true
WITH CHECK clause: true
```

If you're using staff codes (not Supabase Auth), RLS might block you because you're not "authenticated" in Supabase's eyes.

**Quick fix (TEMPORARY - not secure):**
```sql
ALTER TABLE public.competitions DISABLE ROW LEVEL SECURITY;
```

---

## Permanent Solution: Migrate to app_settings Table

### Why This Fixes Everything
Current setup stores `event_day_started` in each competition row → "which row?" confusion.
New setup stores it in ONE dedicated row → always reads/writes the same place.

### Migration Steps

#### 1. Run the SQL migration
Go to Supabase → SQL Editor → paste the file:
`.migrations/create_app_settings_table.sql`

Click **Run**

Verify it worked:
```sql
SELECT * FROM public.app_settings;
```

Should return:
```
id     | event_day_started | profiles_locked
-------+-------------------+-----------------
global | false             | false
```

#### 2. Update the competitionState.ts file
Replace the current `syncGlobalEventDayStatusToSupabase` with:

```typescript
import { updateEventDayStatus } from './appSettings';

export async function syncGlobalEventDayStatusToSupabase(started: boolean) {
    const success = await updateEventDayStatus(started);
    if (success) {
        console.log(`✅ Event Day synced to Supabase: ${started ? 'LIVE' : 'CLOSED'}`);
    }
}
```

#### 3. Update the sync function
Replace `syncEventDayStatusFromSupabase` in `lib/competitionState.ts`:

```typescript
import { fetchAppSettings } from './appSettings';

export async function syncEventDayStatusFromSupabase(): Promise<boolean> {
    try {
        const settings = await fetchAppSettings();
        
        if (settings) {
            const eventDayStarted = settings.event_day_started;
            console.log('[SYNC] Event Day status from Supabase:', eventDayStarted);
            
            await updateCompetitionState({ eventDayStarted }, { syncRemote: false, suppressEvent: false });
            
            return eventDayStarted;
        }
        
        return false;
    } catch (error) {
        console.error('[SYNC ERROR] Failed to fetch event day status:', error);
        return getCompetitionState().eventDayStarted;
    }
}
```

#### 4. (Optional) Add realtime subscription
In the Admin Teams component, add:

```typescript
import { subscribeToAppSettings } from '@/lib/appSettings';

useEffect(() => {
    const channel = subscribeToAppSettings((settings) => {
        if (settings.event_day_started !== undefined) {
            setEventDayStarted(settings.event_day_started);
        }
    });

    return () => {
        supabase.removeChannel(channel);
    };
}, []);
```

---

## Quick Test Checklist

After implementing the fix:

1. ✅ Admin toggles Event Day LIVE
2. ✅ Console shows: `✅ [APP SETTINGS SUCCESS] Event Day is now: LIVE`
3. ✅ Supabase `app_settings` table shows: `event_day_started = true`
4. ✅ Visitor page on another device refreshes → content unlocks
5. ✅ Console shows: `[SYNC] Event Day status from Supabase: true`

---

## What to Share Next

Please run Step 1 and share:
1. What logs appear when you click the toggle button?
2. Any errors in the console?

This will tell us exactly where the break is! 🎯
