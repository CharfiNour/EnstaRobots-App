import { useEffect, useState } from 'react';
import { Bell, ChevronRight, Info, AlertTriangle, CheckCircle, Flame, RefreshCcw, Shield } from 'lucide-react'; // Added RefreshCcw, though primarily using auto-sync
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

interface Announcement {
    id: string;
    title: string;
    message: string;
    created_at: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
}

const FALLBACK_ANNOUNCEMENT: Announcement = {
    id: 'welcome',
    title: 'Dashboard Active',
    message: 'Welcome to your unit console. Real-time updates will appear here.',
    created_at: new Date().toISOString(),
    type: 'info'
};

interface RecentAnnouncementsProps {
    profileComplete?: boolean;
}

export default function RecentAnnouncements({ profileComplete = true }: RecentAnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let channel: any;

        const fetchAnnouncements = async () => {
            if (!profileComplete) {
                setLoading(false);
                return;
            }

            const targetSession = getSession();
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
                // Use type casting to avoid 'never' type errors
                const announcementsData = (data || []) as any[];
                const filtered = announcementsData.filter((ann) => {
                    // Global announcements have null/empty competition_id
                    if (!ann.competition_id) return true;

                    const annCompId = String(ann.competition_id).toLowerCase().trim();
                    const teamCompId = String(teamComp).toLowerCase().trim();

                    return annCompId === teamCompId;
                });

                setAnnouncements(filtered.slice(0, 3).length > 0 ? filtered.slice(0, 3) : [FALLBACK_ANNOUNCEMENT]);
            } catch (err: any) {
                console.group('Dashboard Announcement Fetch Failure');
                console.error('Core Error:', err?.message || err);
                console.groupEnd();
                setAnnouncements([FALLBACK_ANNOUNCEMENT]);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();

        // Real-time subscription for dashboard
        if (profileComplete) {
            channel = supabase
                .channel('dashboard-announcements')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'announcements' },
                    () => {
                        fetchAnnouncements();
                    }
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [profileComplete]);

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-8 h-full flex flex-col shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-role-primary/10 text-role-primary flex items-center justify-center">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-foreground uppercase tracking-tight italic">Latest Intel</h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
                            {profileComplete ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live Feed
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Connection Blocked
                                </>
                            )}
                        </p>
                    </div>
                </div>
                {profileComplete && (
                    <Link href="/team/announcements" className="text-[10px] font-black text-role-primary uppercase hover:underline bg-role-primary/5 px-3 py-1.5 rounded-lg border border-role-primary/10">
                        View All
                    </Link>
                )}
            </div>

            <div className={`space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 ${!profileComplete ? 'blur-md pointer-events-none select-none opacity-40' : ''}`}>
                {(profileComplete ? announcements : [FALLBACK_ANNOUNCEMENT, FALLBACK_ANNOUNCEMENT]).map((ann: Announcement, i) => (
                    <div key={ann.id + i} className="relative pl-5 border-l-2 border-role-primary/20 hover:border-role-primary transition-all py-1 group cursor-pointer hover:translate-x-1 duration-300">
                        <div className="flex justify-between items-start mb-2 gap-3">
                            <p className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-role-primary transition-colors leading-tight">
                                {ann.title}
                            </p>
                            <span className="text-[10px] font-bold text-muted-foreground shrink-0 tabular-nums">
                                {getTimeAgo(ann.created_at)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {ann.message}
                        </p>
                    </div>
                ))}

                {!loading && profileComplete && announcements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center flex-1">
                        <Bell size={40} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No active intel</p>
                    </div>
                )}

                {loading && profileComplete && (
                    <div className="space-y-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex flex-col gap-3">
                                <div className="h-2.5 w-32 bg-muted rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-muted rounded-full"></div>
                                    <div className="h-2 w-2/3 bg-muted rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!profileComplete && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-card/20 group-hover:bg-card/30 transition-colors">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">
                            <Shield size={24} />
                        </div>
                        <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Intel Blocked</h3>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                            Authorized access only. Complete registry to sync with the official intel feed.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
