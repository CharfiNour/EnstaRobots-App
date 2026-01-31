"use client";

import { useEffect, useState } from 'react';
import { History, Activity } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';
import { RestrictionScreen } from '../components';
import { getCompetitionState, syncEventDayStatusFromSupabase } from '@/lib/competitionState';
import { fetchTeamsFromSupabase, fetchCompetitionsFromSupabase } from '@/lib/supabaseData';
import { canonicalizeCompId } from '@/lib/constants';
import { useProfileStatus } from '../hooks/useProfileStatus';
import { IncompleteRegistryView } from '../components';

export default function TeamScoreHistoryPage() {
    const { profileComplete, loading: statusLoading } = useProfileStatus();
    const [loading, setLoading] = useState(true);
    const [eventDayStarted, setEventDayStarted] = useState(getCompetitionState().eventDayStarted);
    const [session, setSession] = useState<any>(null);
    const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
    const [availableCompetitions, setAvailableCompetitions] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);

        const loadClubContext = async () => {
            try {
                const [teams, competitions] = await Promise.all([
                    fetchTeamsFromSupabase('minimal'),
                    fetchCompetitionsFromSupabase()
                ]);

                const clubName = currentSession.clubName || teams.find(t => t.id === currentSession.teamId)?.club;

                const myClubTeams = teams.filter((t: any) =>
                    t.club && clubName && t.club.trim().toLowerCase() === clubName.trim().toLowerCase()
                );

                const clubComps = competitions.filter(c =>
                    myClubTeams.some(t => {
                        const teamCanon = canonicalizeCompId(t.competition, competitions);
                        const compCanon = canonicalizeCompId(c.id, competitions);
                        return teamCanon === compCanon && teamCanon !== '';
                    })
                );

                setAvailableCompetitions(clubComps);

                if (clubComps.length > 0) {
                    setSelectedCompId(clubComps[0].id);
                }
            } catch (e) {
                console.error("Failed to load club context", e);
            } finally {
                setLoading(false);
            }
        };

        const handleSync = () => {
            const state = getCompetitionState();
            setEventDayStarted(state.eventDayStarted);
        };

        syncEventDayStatusFromSupabase().then(handleSync);
        loadClubContext();

        window.addEventListener('competition-state-updated', handleSync);
        return () => window.removeEventListener('competition-state-updated', handleSync);
    }, [router]);

    if (loading || statusLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profileComplete) {
        return (
            <div className="min-h-screen py-10 px-6 container mx-auto max-w-7xl">
                <IncompleteRegistryView />
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
                    allowedCompetitions={availableCompetitions}
                    initialCompetition={selectedCompId || undefined}
                />
            </div>
        </div>
    );
}
