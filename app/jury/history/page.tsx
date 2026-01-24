"use client";

import { useEffect, useState } from 'react';
import { History, Activity } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';

export default function JuryHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'jury') {
            router.push('/auth/jury');
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
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-2xl shadow-role-primary/40 ring-1 ring-white/20">
                            <History className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tighter uppercase italic leading-none mb-2">
                                Score List
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                                <Activity size={14} className="text-role-primary" />
                                Performance Records & Telemetry Verification
                            </p>
                        </div>
                    </div>
                </div>

                <ScoreHistoryView
                    isSentToTeamOnly={false}
                    lockedCompetitionId={session?.competition}
                    isJury={true}
                />
            </div>
        </div>
    );
}
