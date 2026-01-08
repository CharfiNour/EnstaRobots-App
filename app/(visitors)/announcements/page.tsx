"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, Filter, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: '1', label: 'Junior Line Follower' },
    { id: '2', label: 'Junior All Terrain' },
    { id: '3', label: 'Line Follower' },
    { id: '4', label: 'All Terrain' },
    { id: '5', label: 'Fight' }
];

const TYPE_CONFIG: any = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500/20' },
    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/20' },
    urgent: { icon: AlertOctagon, color: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500/20' },
};

export default function AnnouncementsPage() {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();

        // Subscribe to real-time changes
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

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('visible_to', 'all') // Visitors only see public announcements
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (err) {
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAnnouncements = announcements.filter(ann => {
        if (selectedFilter === 'all') return true;
        // Show if announcement is global (null competition_id) or matches selected competition
        return ann.competition_id === null || ann.competition_id === parseInt(selectedFilter);
    });

    const getTypeConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

    const getCompetitionLabel = (id: number | null) => {
        if (id === null) return 'Global Broadcast';
        const filter = FILTERS.find(f => f.id === id.toString());
        return filter ? filter.label : 'General';
    };

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

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10"
            >
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${selectedFilter === filter.id
                                ? 'bg-accent text-background shadow-md shadow-accent/20 scale-105'
                                : 'bg-card border border-card-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            <motion.div
                layout
                className="max-w-3xl mx-auto space-y-6"
            >
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredAnnouncements.length > 0 ? (
                            filteredAnnouncements.map((ann) => {
                                const config = getTypeConfig(ann.type);
                                const Icon = config.icon;

                                return (
                                    <motion.div
                                        key={ann.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className={`p-6 rounded-2xl bg-card border ${config.border} shadow-md shadow-black/[0.02] relative overflow-hidden group hover:shadow-lg transition-all`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${config.bg}`}></div>
                                        <div className="flex justify-between items-start mb-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-muted/30 ${config.color}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <h4 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">{ann.title}</h4>
                                            </div>
                                            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-card-border shrink-0 ml-2">
                                                {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="pl-14">
                                            <p className="text-muted-foreground leading-relaxed mb-4">{ann.message}</p>
                                            <div className="flex items-center gap-2">
                                                <Tag size={12} className="text-muted-foreground/60" />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${ann.competition_id === null ? 'text-accent' : 'text-foreground'}`}>
                                                    {getCompetitionLabel(ann.competition_id)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-muted-foreground"
                            >
                                <p>No announcements found.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
        </div>
    );
}
