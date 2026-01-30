"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, Filter, Info, AlertTriangle, CheckCircle, Flame, RefreshCcw, Activity, Shield } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchTeamsFromSupabase } from '@/lib/supabaseData';
import { RegistryAlert, RestrictionScreen } from '../components';
import { getCompetitionState } from '@/lib/competitionState';

// Mock data as fallback
const FALLBACK_ANNOUNCEMENTS = [
    { id: '1', title: 'Welcome to EnstaRobots!', message: 'Good luck to all teams competing this year. Make sure to complete your team profile to stay synchronized with the official live feed.', type: 'success', created_at: new Date().toISOString(), competition_id: null },
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
    const [teamData, setTeamData] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [eventDayStarted, setEventDayStarted] = useState(getCompetitionState().eventDayStarted);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        const currentSession = getSession();

        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }

        const loadData = async () => {
            if (isMounted) {
                setSession(currentSession);
                setEventDayStarted(getCompetitionState().eventDayStarted);
            }

            try {
                // Fetch team data to check is_placeholder
                const teams = await fetchTeamsFromSupabase('minimal');
                const myTeam = teams.find(t => t.id === currentSession.teamId);

                if (isMounted) {
                    setTeamData(myTeam);
                    if (myTeam && !myTeam.isPlaceholder) {
                        await fetchAnnouncements(currentSession);
                    }
                }
            } catch (err) {
                console.error("Error loading announcements page data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();

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
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [router]);

    const fetchAnnouncements = async (activeSession?: any) => {
        const targetSession = activeSession || session || getSession();
        if (!targetSession) return;

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
        }
    };

    // Event Day Restriction
    if (!eventDayStarted) {
        return <RestrictionScreen />;
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Access Restricted for Incomplete Profiles
    if (teamData?.isPlaceholder) {
        return (
            <div className="min-h-screen py-12 px-6 flex flex-col items-center justify-center">
                <div className="max-w-md w-full text-center space-y-8">
                    <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-amber-500/20">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Shield className="w-12 h-12 text-amber-500" />
                        </motion.div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight mb-3">Feed Access Restricted</h1>
                        <p className="text-muted-foreground font-medium">Intel and announcements are restricted to verified units only. Complete the registry to sync with the global feed.</p>
                    </div>
                    <RegistryAlert />
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-15 h-15 rounded-xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-xl shadow-role-primary/20 ring-1 ring-white/10">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none mb-2">
                                Team Announcements
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                                <Activity size={14} className="text-role-primary" />
                                Official Directives & Intel Feed
                            </p>
                        </div>
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
