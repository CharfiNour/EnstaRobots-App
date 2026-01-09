import { AnnouncementType, VisibilityOption } from '../types';
import { supabase } from '@/lib/supabase';

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
    { id: '1', title: 'Junior Line Follower' },
    { id: '2', title: 'Junior All Terrain' },
    { id: '3', title: 'Line Follower' },
    { id: '4', title: 'All Terrain' },
    { id: '5', title: 'Fight (Battle Robots)' },
];

export const publishAnnouncement = async (formData: any) => {
    const { error } = await supabase.from('announcements').insert({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        visible_to: formData.visibleTo,
        competition_id: formData.competitionId === 'all' ? null : parseInt(formData.competitionId),
    });

    if (error) throw error;
};
