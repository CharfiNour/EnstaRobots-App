import { useEffect, useState } from 'react';
import { Bell, ChevronRight, Info, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

export default function RecentAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .or(`visible_to.eq.all,visible_to.eq.teams`)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (error) throw error;
                setAnnouncements(data && data.length > 0 ? data : [FALLBACK_ANNOUNCEMENT]);
            } catch (err) {
                console.error('Error fetching dashboard announcements:', err);
                setAnnouncements([FALLBACK_ANNOUNCEMENT]);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

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
        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-8 h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-role-primary/10 text-role-primary flex items-center justify-center">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-foreground uppercase tracking-tight italic">Latest Intel</h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">HQ Broadcasts</p>
                    </div>
                </div>
                <Link href="/team/announcements" className="text-[10px] font-black text-role-primary uppercase hover:underline bg-role-primary/5 px-3 py-1.5 rounded-lg border border-role-primary/10">
                    View All
                </Link>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                {announcements.map((ann) => (
                    <div key={ann.id} className="relative pl-5 border-l-2 border-role-primary/20 hover:border-role-primary transition-all py-1 group cursor-pointer hover:translate-x-1 duration-300">
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

                {!loading && announcements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center flex-1">
                        <Bell size={40} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No active intel</p>
                    </div>
                )}

                {loading && (
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
        </div>
    );
}
