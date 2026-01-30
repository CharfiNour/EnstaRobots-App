"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { COMPETITION_CATEGORIES, getCompetitionName } from '@/lib/constants';
import { getCompetitionState, syncEventDayStatusFromSupabase } from '@/lib/competitionState';
import RestrictionScreen from '@/components/common/RestrictionScreen';

const TYPE_CONFIG: any = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500/20' },
    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/20' },
    urgent: { icon: AlertOctagon, color: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500/20' },
};

export default function AnnouncementsPage() {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [eventDayStarted, setEventDayStarted] = useState(getCompetitionState().eventDayStarted);
    const [loading, setLoading] = useState(true);

    const filters = [
        { id: 'all', label: 'All Updates' },
        ...COMPETITION_CATEGORIES.map(c => ({ id: c.id, label: c.name }))
    ];

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('visible_to', 'all')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);

            // Sync event day status from Supabase on every fetch
            const syncedStatus = await syncEventDayStatusFromSupabase();
            setEventDayStarted(syncedStatus);
        } catch (err) {
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Sync event day status from database first
        syncEventDayStatusFromSupabase().then(status => {
            setEventDayStarted(status);
        });

        fetchAnnouncements();

        const channel = supabase
            .channel('announcements_broadcast')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
                const newAnnouncement = payload.new;
                if (newAnnouncement.visible_to === 'all') {
                    setAnnouncements(prev => [newAnnouncement, ...prev]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredAnnouncements = announcements.filter(ann => {
        if (selectedFilter === 'all') return true;
        // Handle both UUID and legacy/slug comparison
        return ann.competition_id === selectedFilter || ann.competition_type === selectedFilter;
    });

    if (!eventDayStarted) {
        return <RestrictionScreen />;
    }

    return (
        <div className="min-h-screen container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <div className="inline-flex items-center gap-3 mb-4 bg-accent/10 px-6 py-3 rounded-full border border-accent/20">
                    <Bell className="w-6 h-6 text-accent" />
                    <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent uppercase tracking-tight">
                        Broadcasts & Updates
                    </h1>
                </div>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Stay up to date with the latest news, schedule changes and notifications.
                </p>
            </motion.div>


            <div className="max-w-3xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredAnnouncements.length > 0 ? (
                            filteredAnnouncements.map((ann) => {
                                const config = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
                                const Icon = config.icon;

                                return (
                                    <motion.div
                                        key={ann.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                        className={`p-5 md:p-6 rounded-[1.5rem] bg-white border ${config.border} shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${config.bg} opacity-80`} />

                                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl ${config.bg}/10 flex items-center justify-center shrink-0 border ${config.border}`}>
                                                <Icon className={`w-6 h-6 ${config.color}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                    <h4 className="font-black text-lg md:text-xl text-foreground tracking-tight uppercase italic group-hover:text-accent transition-colors">
                                                        {ann.title}
                                                    </h4>
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase opacity-70 px-3 py-1 bg-muted rounded-full">
                                                        {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                                                    </div>
                                                </div>

                                                <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-4 font-medium opacity-80">
                                                    {ann.message}
                                                </p>

                                                <div className="flex items-center gap-3 pt-3 border-t border-muted">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${!ann.competition_id ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-foreground/5 border-foreground/10 text-foreground'}`}>
                                                        <Tag size={10} className="opacity-60" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            {ann.competition_id ? getCompetitionName(ann.competition_id) : 'Global Broadcast'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No announcements found.</p>
                            </div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
