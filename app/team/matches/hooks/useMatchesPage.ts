import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { getTeams, Team, Competition } from '@/lib/teams';
import { getCompetitionState, CompetitionState, syncEventDayStatusFromSupabase } from '@/lib/competitionState';
import { supabase } from '@/lib/supabase';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase, fetchScoresFromSupabase } from '@/lib/supabaseData';
import { canonicalizeCompId } from '@/lib/constants';

export function useMatchesPage() {
    const [teamData, setTeamData] = useState<any>(null);
    const [compState, setCompState] = useState<CompetitionState | null>(getCompetitionState());
    const [currentTeam, setCurrentTeam] = useState<any>(null);
    const [nextTeam, setNextTeam] = useState<any>(null);
    const [nextPhase, setNextPhase] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPhase, setCurrentPhase] = useState<string | null>(null);
    const [isLiveForMyComp, setIsLiveForMyComp] = useState(false);
    const [competitions, setCompetitions] = useState<Competition[]>([]);

    useEffect(() => {
        let isMounted = true;

        const fetchInitialData = async () => {
            const currentSession = getSession();
            if (!currentSession?.teamId) {
                if (isMounted) setLoading(false);
                return;
            }

            // Fetch Data Concurrently
            const [
                teams,
                sessions,
                remoteComps,
                compState,
                allScores
            ] = await Promise.all([
                fetchTeamsFromSupabase('minimal'),
                fetchLiveSessionsFromSupabase(),
                fetchCompetitionsFromSupabase(),
                getCompetitionState(),
                fetchScoresFromSupabase()
            ]);

            if (!isMounted) return;

            setCompetitions(remoteComps);
            setCompState(compState);

            const myTeam = teams.find((t: any) => t.id === currentSession.teamId);

            if (myTeam) {
                // Determine relevant competition
                const relevantComp = remoteComps.find((c: Competition) => c.id === myTeam.competition || c.type === myTeam.competition);
                const activePhase = relevantComp?.current_phase;
                const canonicalMyComp = canonicalizeCompId(myTeam.competition, remoteComps);

                // Check for live session in my competition
                const safeSessions = sessions || {};
                const session = (relevantComp?.id && safeSessions[relevantComp.id])
                    || (relevantComp?.type && safeSessions[relevantComp.type])
                    || (myTeam.competition && safeSessions[myTeam.competition]);

                // A phase is officially "Drawn" or "Started" if:
                // 1. There is an active live session
                // 2. OR there are scores recorded for the active phase
                // 3. AND the active phase is not "upcoming" or "completed"
                const isValidPhase = activePhase &&
                    activePhase !== 'upcoming' &&
                    activePhase !== 'Not Started' &&
                    !activePhase.includes('Completed');

                const hasScoresForPhase = isValidPhase && allScores.some((s: any) => {
                    const sComp = canonicalizeCompId(s.competitionType || s.competitionId, remoteComps);
                    const sPhase = String(s.phase).toLowerCase();
                    const targetPhase = String(activePhase).toLowerCase();

                    return sComp === canonicalMyComp &&
                        (sPhase === targetPhase || (sPhase === 'essay 1' && targetPhase === 'essay 1') || (sPhase === 'essay 2' && targetPhase === 'essay 2'));
                });

                const isDrawn = !!session || hasScoresForPhase;

                // Filter teams for this competition
                const compTeams = teams.filter((t: any) => canonicalizeCompId(t.competition, remoteComps) === canonicalMyComp);

                // Calculate order
                let myOrder = null;
                if (isDrawn) {
                    // If drawn, we can use the registry index as the default turn number
                    const myIdx = compTeams.findIndex((t: any) => t.id === myTeam.id);
                    myOrder = myIdx !== -1 ? myIdx + 1 : null;
                }

                setTeamData({ ...myTeam, order: myOrder });

                if (session) {
                    setCurrentPhase(session.phase);
                    setIsLiveForMyComp(true);

                    const activeTeamId = session.teamId;
                    const activeTeam = teams.find((t: any) => t.id === activeTeamId);

                    if (activeTeam) {
                        const currentIdx = compTeams.findIndex((t: any) => t.id === activeTeamId);
                        if (currentIdx !== -1) {
                            setCurrentTeam({ ...activeTeam, order: currentIdx + 1 });

                            const nextIdx = (currentIdx + 1) % compTeams.length;
                            setNextTeam({ ...compTeams[nextIdx], order: nextIdx + 1 });

                            if (currentIdx === compTeams.length - 1) {
                                setNextPhase('Next Stage');
                            } else {
                                setNextPhase(null);
                            }
                        }
                    }
                } else {
                    setIsLiveForMyComp(false);
                }
            }

            setLoading(false);
        };

        fetchInitialData();

        // Sync event day status from Supabase
        syncEventDayStatusFromSupabase().then(status => {
            if (isMounted) setCompState(prev => prev ? { ...prev, eventDayStarted: status } : null);
        });

        // 1. Listen for Local Events
        const handleLocalUpdate = () => {
            console.log('🔄 Local update event received, refreshing...');
            fetchInitialData();
        };
        window.addEventListener('competition-state-updated', handleLocalUpdate);

        // 2. Listen for Supabase Realtime Events
        console.log('🔌 Subscribing to live_sessions changes...');
        const channel = supabase
            .channel(`live_sessions_tracker_${Math.random()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'live_sessions' },
                (payload) => {
                    console.log('⚡ Realtime Update Received:', payload);
                    fetchInitialData();
                }
            )
            .subscribe((status) => {
                console.log(`📡 Subscription status: ${status}`);
            });

        return () => {
            isMounted = false;
            window.removeEventListener('competition-state-updated', handleLocalUpdate);
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        teamData,
        compState,
        currentTeam,
        nextTeam,
        nextPhase,
        loading,
        currentPhase,
        isLive: isLiveForMyComp,
        competitions
    };
}
