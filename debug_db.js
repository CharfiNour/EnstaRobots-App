
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pebvhvygijhxwwgbzjls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYnZodnlnaWpoeHd3Z2J6amxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1OTgyMzAsImV4cCI6MjA4MzE3NDIzMH0.f0VmN_VKlje0zhBQnHdg9JO9QCrhfiivR0ZG6mXW1LU';

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
        console.table(teams.map(t => ({ id: t.id, name: t.name, competition: t.competition_id })));
    }
}

debugData();
