"use client";

import { useEffect, useState } from 'react';
import { Plus, LayoutDashboard } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Local imports
import { CompetitionCard } from './components';
import { getAdminCompetitions, saveAdminCompetitions } from './services/competitionService';
import { CompetitionListItem } from './types';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';

export default function CompetitionsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || (currentSession.role !== 'admin' && currentSession.role !== 'jury')) {
            router.push('/auth/jury');
            return;
        }
        setSession(currentSession);
        setCompetitions(getAdminCompetitions());
        setLoading(false);

        // Initial fetch from DB
        fetchLiveSessionsFromSupabase().then(sessions => {
            if (Object.keys(sessions).length > 0) {
                updateCompetitionState({ liveSessions: sessions });
            }
        });
    }, [router]);

    const handleRealtimeUpdate = async () => {
        const sessions = await fetchLiveSessionsFromSupabase();
        updateCompetitionState({ liveSessions: sessions });
    };

    useSupabaseRealtime('live_sessions', handleRealtimeUpdate);

    const handleUpdate = (updated: CompetitionListItem) => {
        setCompetitions(prev => {
            const next = prev.map(c => c.id === updated.id ? updated : c);
            saveAdminCompetitions(next);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-12">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                        <LayoutDashboard className="w-8 h-8 text-accent" />
                        Tournament Console
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2">
                        Centralized logistics and live synchronization
                    </p>
                </div>

                <div className="space-y-6">
                    {competitions.map((comp, index) => (
                        <CompetitionCard
                            key={comp.id}
                            comp={comp}
                            index={index}
                            onUpdate={handleUpdate}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
