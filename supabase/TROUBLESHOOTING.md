# 🔍 TROUBLESHOOTING: Staff Code Creation Failure

## Current Status
- ✅ Table exists (you have 3 rows)
- ❌ Creating new codes fails with alert: "Failed to create staff code. Please try again."

## 🎯 IMMEDIATE ACTIONS

### Action 1: Check Browser Console for Exact Error

1. **Open Browser DevTools**
   - Press `F12` or right-click → Inspect
   - Click on **"Console"** tab

2. **Try Creating a Staff Code Again**
   - Admin → Matches → Codes
   - Click "+ New Staff Node"
   - Fill in the form
   - Click ✓ to submit

3. **Look for These Messages:**
   - `Error creating staff code: {...}`
   - `Error details: {...}`
   
4. **Copy the EXACT error message** and share it

The error will likely be one of these:

---

### Possible Error 1: RLS Recursion (42P17)
```json
{
  "code": "42P17",
  "message": "infinite recursion detected in policy for relation \"profiles\""
}
```

**Fix:** Run this SQL in Supabase SQL Editor:

```sql
-- Drop ALL existing policies
DROP POLICY IF EXISTS "Staff codes are readable by everyone for login" ON staff_codes;
DROP POLICY IF EXISTS "Admins can manage staff codes" ON staff_codes;
DROP POLICY IF EXISTS "Allow anonymous insert for initial setup" ON staff_codes;
DROP POLICY IF EXISTS "Allow anonymous update for management" ON staff_codes;
DROP POLICY IF EXISTS "Allow anonymous delete for management" ON staff_codes;

-- Recreate simple, working policies
CREATE POLICY "public_read" ON staff_codes FOR SELECT USING (true);
CREATE POLICY "public_insert" ON staff_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update" ON staff_codes FOR UPDATE WITH CHECK (true);
CREATE POLICY "public_delete" ON staff_codes FOR DELETE USING (true);
```

---

### Possible Error 2: RLS Not Enabled
```json
{
  "code": "42501",
  "message": "new row violates row-level security policy"
}
```

**Fix:** Run this SQL:

```sql
-- Disable RLS temporarily to test
ALTER TABLE staff_codes DISABLE ROW LEVEL SECURITY;
```

Then try creating a code. If it works, the issue is RLS policies.

To re-enable with proper policies:
```sql
ALTER TABLE staff_codes ENABLE ROW LEVEL SECURITY;

-- Add permissive policies
CREATE POLICY "allow_all" ON staff_codes FOR ALL USING (true) WITH CHECK (true);
```

---

### Possible Error 3: Foreign Key Violation
```json
{
  "code": "23503",
  "message": "insert or update on table \"staff_codes\" violates foreign key constraint"
}
```

**Cause:** `competition_id` doesn't exist in `competitions` table.

**Fix:** The competition ID being inserted doesn't match any real competition.

Check valid competition IDs:
```sql
SELECT id, title, category FROM competitions;
```

Or, make `competition_id` nullable and set it to `NULL` for testing:
```sql
ALTER TABLE staff_codes ALTER COLUMN competition_id DROP NOT NULL;
```

---

### Possible Error 4: Unique Constraint Violation
```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint \"staff_codes_code_key\""
}
```

**Cause:** The randomly generated code already exists.

**Fix:** This is very unlikely with random codes, but if it happens:
- Try creating the code again (different random code will be generated)
- Or check if there's an issue with the random code generator

---

### Possible Error 5: Connection/Auth Issues
```json
{
  "message": "Failed to fetch"
}
```

**Causes:**
- Supabase URL or key is incorrect
- Network issue
- CORS issue

**Fix:** Check `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Verify these values match your Supabase project settings.

---

## 🧪 Diagnostic Steps

### Step 1: Run Diagnostic SQL

Copy this to Supabase SQL Editor:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff_codes';

-- Check current policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'staff_codes';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'staff_codes';

-- Try manual insert
INSERT INTO staff_codes (role, name, code, competition_id) 
VALUES ('jury', 'Manual Test', 'MANUAL-TEST', NULL)
RETURNING *;

-- If successful, delete test row
DELETE FROM staff_codes WHERE code = 'MANUAL-TEST';
```

If the manual insert **works** in SQL Editor but **fails** in the app:
- Issue is with the frontend code or Supabase client
- Not a database issue

If the manual insert **also fails**:
- Issue is with RLS policies or table constraints
- The error message will tell you exactly what's wrong

---

### Step 2: Temporarily Disable RLS (For Testing)

```sql
ALTER TABLE staff_codes DISABLE ROW LEVEL SECURITY;
```

Try creating a code in the app. If it works:
- **Problem confirmed**: RLS policies are blocking inserts
- **Solution**: Fix the policies (see Error 1 above)

After testing, re-enable RLS:
```sql
ALTER TABLE staff_codes ENABLE ROW LEVEL SECURITY;
```

---

### Step 3: Check Supabase Client Configuration

Open: `lib/supabase.ts`

Verify it looks like this:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Check `.env.local` exists and has correct values.

---

## 📊 Quick Reference

| Error Code | Meaning | Quick Fix |
|-----------|---------|-----------|
| 42P17 | RLS recursion | Drop and recreate policies |
| 42501 | RLS blocking | Disable RLS or fix policies |
| 23503 | Foreign key violation | Use NULL for competition_id |
| 23505 | Duplicate code | Try again (new random code) |
| - | Network error | Check Supabase credentials |

---

## ✅ After You Find the Error

1. **Share the exact error message** from browser console
2. I'll give you the specific fix
3. Or try the diagnostic steps above

The enhanced error message in the alert will now show you:
- The exact error message
- The error code (if available)
- Where to find more details

---

## 🚀 Next Steps

1. **Open browser console (F12)**
2. **Try creating a staff code**
3. **Copy the error message** you see in the console
4. **Share it with me** or try the fixes above

The app now has better error reporting, so you'll see exactly what's wrong!
