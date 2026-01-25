"use client";

import { useEffect, useState } from 'react';
import { History, Activity } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';

export default function TeamScoreHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-transparent">
            {/* Background Decorative Element */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-role-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-role-secondary/10 blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl relative z-10">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-15 h-15 rounded-xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-xl shadow-role-primary/20 ring-1 ring-white/10">
                            <History className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none mb-2">
                                Score Registry
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                                <Activity size={14} className="text-role-primary" />
                                Official Performance Archives
                            </p>
                        </div>
                    </div>
                </div>

                <ScoreHistoryView
                    isSentToTeamOnly={true}
                />
            </div>
        </div>
    );
}
