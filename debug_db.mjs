
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    console.log('--- DB DEBUG DUMP ---');

    const { data: competitions, error: compErr } = await supabase.from('competitions').select('*');
    if (compErr) console.error('Comps Error:', compErr);
    else {
        console.log('\n--- COMPETITIONS ---');
        console.table(competitions.map(c => ({ id: c.id, type: c.type, name: c.name })));
    }

    const { data: teams, error: teamErr } = await supabase.from('teams').select('*');
    if (teamErr) console.error('Teams Error:', teamErr);
    else {
        console.log('\n--- TEAMS ---');
        console.table(teams.map(t => ({ id: t.id, name: t.name, competition: t.competition })));
    }
}

debugData();
