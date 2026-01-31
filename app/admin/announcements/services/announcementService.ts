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
    { value: 'juries', label: 'Juries Only' },
    { value: 'admins', label: 'Admins Only' },
];

import { COMPETITION_CATEGORIES } from '@/lib/constants';

export const COMPETITIONS = [
    { id: 'all', title: 'Global (All Competitions)' },
    ...COMPETITION_CATEGORIES.map(c => ({ id: c.type, title: c.name }))
];

export const fetchRealCompetitions = async () => {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('id, name')
            .order('name');

        if (error) {
            console.error('Supabase Error:', error);
            return [{ id: 'all', title: 'Global (All Competitions)' }];
        }

        if (!data || data.length === 0) {
            console.warn('No competitions found in database');
            return [{ id: 'all', title: 'Global (All Competitions)' }];
        }

        // Map database competitions with proper UUID ids and filter out 'fight'
        const competitions = [
            { id: 'all', title: 'Global (All Competitions)' },
            ...(data as any[])
                .filter(comp => {
                    const name = String(comp.name || '').toUpperCase();
                    return !name.includes('FIGHT');
                })
                .map(comp => ({
                    id: comp.id, // This is the UUID
                    title: comp.name
                }))
        ];

        return competitions;

    } catch (err) {
        console.error('Network or initialization error:', err);
        return [{ id: 'all', title: 'Global (All Competitions)' }];
    }
};

export const publishAnnouncement = async (formData: any) => {
    const insertData: DBAnnouncementInsert = {
        title: formData.title as string,
        message: formData.message as string,
        type: formData.type as string,
        visible_to: formData.visibleTo as string,
        // Allow both UUIDs and system slugs (now that DB is TEXT)
        competition_id: formData.competitionId === 'all' ? null : formData.competitionId,
    };

    const { error } = await (supabase.from('announcements') as any).insert(insertData);

    if (error) throw error;
};

export const getAnnouncements = async () => {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
