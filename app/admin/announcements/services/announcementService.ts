import { AnnouncementType, VisibilityOption } from '../types';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type DBAnnouncementInsert = Database['public']['Tables']['announcements']['Insert'];

export const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
    { value: 'info', label: 'Info', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'success', label: 'Success', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { value: 'urgent', label: 'Urgent', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export const VISIBILITY_OPTIONS: VisibilityOption[] = [
    { value: 'all', label: 'All Users' },
    { value: 'teams', label: 'Teams Only' },
    { value: 'judges', label: 'Judges Only' },
    { value: 'admins', label: 'Admins Only' },
];

export const COMPETITIONS = [
    { id: 'all', title: 'Global (All Competitions)' },
    { id: 'junior_line_follower', title: 'Junior Line Follower' },
    { id: 'junior_all_terrain', title: 'Junior All Terrain' },
    { id: 'line_follower', title: 'Line Follower' },
    { id: 'all_terrain', title: 'All Terrain' },
    { id: 'fight', title: 'Fight (Battle Robots)' },
];

export const fetchRealCompetitions = async () => {
    try {
        // Environment diagnostic
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Supabase environment variables are missing!');
            console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
            console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');
            console.error('Please check your .env.local file');
            return [];
        }

        console.log('📡 Fetching competitions from Supabase...');

        const { data, error } = await supabase
            .from('competitions')
            .select('*');

        if (error) {
            console.error('❌ Supabase Error:');
            console.error('  Message:', error.message || 'No message');
            console.error('  Code:', error.code || 'No code');
            console.error('  Details:', error.details || 'No details');
            console.error('  Hint:', error.hint || 'No hint');
            console.error('  Full error:', error);
            return [];
        }

        console.log('✅ Successfully fetched competitions:', data?.length || 0, 'items');
        if (data && data.length > 0) {
            console.log('📋 Available columns:', Object.keys(data[0]));
        }

        // If Supabase table is empty, fallback to hardcoded list
        if (!data || data.length === 0) {
            console.log('⚠️  No competitions in Supabase, using fallback list');
            return COMPETITIONS;
        }

        const comps = (data || []) as any[];

        return [
            { id: 'all', title: 'Global (All Competitions)' },
            ...comps.map(comp => ({
                id: comp.id,
                // Try multiple possible column names
                title: comp.name || comp.title || comp.competition_name || `Competition ${comp.id}`
            }))
        ];

    } catch (err) {
        console.error('❌ Network or initialization error:');
        console.error('  Type:', err instanceof Error ? err.constructor.name : typeof err);
        console.error('  Message:', err instanceof Error ? err.message : String(err));
        console.error('  Stack:', err instanceof Error ? err.stack : 'No stack trace');
        return [];
    }
};

export const publishAnnouncement = async (formData: any) => {
    const insertData: DBAnnouncementInsert = {
        title: formData.title as string,
        message: formData.message as string,
        type: formData.type as string,
        visible_to: formData.visibleTo as string,
        // Ensure competitionId is a valid UUID or null
        competition_id: (formData.competitionId === 'all' ||
            typeof formData.competitionId !== 'string' ||
            !formData.competitionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
            ? null
            : formData.competitionId,
    };

    const { error } = await (supabase.from('announcements') as any).insert(insertData);

    if (error) throw error;
};
