"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, Filter, Info, AlertTriangle, CheckCircle, Flame, RefreshCcw } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Mock data as fallback
const FALLBACK_ANNOUNCEMENTS = [
    { id: '1', title: 'Welcome to EnstaRobots!', message: 'Good luck to all teams competing this year. Make sure to complete your team profile to be visible on the public rankings.', type: 'success', created_at: new Date().toISOString(), competition_id: null },
    { id: '2', title: 'Schedule Update', message: 'The opening ceremony will start at 9:00 AM tomorrow in the main hall.', type: 'info', created_at: new Date().toISOString(), competition_id: null },
];

const TYPE_CONFIG = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    urgent: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function TeamAnnouncementsPage() {
    const [session, setSession] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);
        fetchAnnouncements(currentSession);

        // REAL-TIME SUBSCRIPTION
        const channel = supabase
            .channel('public:announcements')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'announcements' },
                () => {
                    console.log('[REALTIME] Announcements updated, refreshing...');
                    fetchAnnouncements(currentSession);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    const fetchAnnouncements = async (activeSession?: any) => {
        const targetSession = activeSession || session || getSession();
        if (!targetSession) {
            setLoading(false);
            return;
        }

        try {
            const teamComp = targetSession.competition;

            // Fetch ALL team-visible announcements first
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .or('visible_to.eq.all,visible_to.eq.teams')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Performance client-side filtering for competition category
            const announcementsData = (data || []) as any[];
            console.log(`[DEBUG] Received ${announcementsData.length} team-visible announcements`);
            console.log(`[DEBUG] Filtering for team competition: "${teamComp}"`);

            const filtered = announcementsData.filter(ann => {
                // Global announcements have null/empty competition_id
                if (!ann.competition_id) return true;

                const annCompId = String(ann.competition_id).toLowerCase().trim();
                const teamCompId = String(teamComp).toLowerCase().trim();

                const isMatch = annCompId === teamCompId;

                if (isMatch) {
                    console.log(`[DEBUG] MATCH FOUND: "${ann.title}" (ID: ${ann.id}) matches ${teamCompId}`);
                }

                return isMatch;
            });

            console.log(`[DEBUG] Filter complete. Result: ${filtered.length} announcements`);
            setAnnouncements(filtered.length > 0 ? filtered : FALLBACK_ANNOUNCEMENTS);
        } catch (err: any) {
            console.group('Announcement Fetch Failure');
            console.error('Core Error:', err?.message || err);
            console.groupEnd();
            setAnnouncements(FALLBACK_ANNOUNCEMENTS);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-3 mb-4 bg-role-primary/10 px-6 py-3 rounded-full border border-role-primary/20 shadow-sm shadow-role-primary/5">
                            <Bell className="w-6 h-6 text-role-primary" />
                            <h1 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight italic">
                                Team Announcements
                            </h1>
                        </div>
                        <p className="text-muted-foreground max-w-lg font-medium">
                            Stay informed with the latest updates from the organization team. Important notifications will appear here.
                        </p>
                    </div>

                    <div className="flex items-center justify-center md:justify-end gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-card-border/50">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">Live Intel Sync</span>
                        </div>
                        <button
                            onClick={() => fetchAnnouncements(session)}
                            className="p-3 bg-card border border-role-primary/20 rounded-xl text-role-primary hover:bg-role-primary hover:text-white transition-all shadow-lg shadow-role-primary/5 hover:scale-110 active:scale-95 group"
                            title="Force Refresh"
                        >
                            <RefreshCcw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {announcements.map((ann: any, i: number) => {
                            const config = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
                            const Icon = config.icon;

                            return (
                                <motion.div
                                    key={ann.id || i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`p-6 rounded-2xl bg-card border ${config.border} shadow-sm group hover:shadow-md transition-all relative overflow-hidden`}
                                >
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${config.color.replace('text', 'bg')}`}></div>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                                                <Icon className={`w-6 h-6 ${config.color}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-role-primary transition-colors">
                                                    {ann.title}
                                                </h3>
                                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                    {ann.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                                {new Date(ann.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            {ann.competition_id && (
                                                <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-role-primary">
                                                    Competition Specific
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {announcements.length === 0 && (
                        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-card-border">
                            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No announcements yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
