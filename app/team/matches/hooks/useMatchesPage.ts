import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { getTeams, Team, Competition } from '@/lib/teams';
import { getCompetitionState, CompetitionState } from '@/lib/competitionState';
import { supabase } from '@/lib/supabase';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase } from '@/lib/supabaseData';

export function useMatchesPage() {
    const [teamData, setTeamData] = useState<any>(null);
    const [compState, setCompState] = useState<CompetitionState | null>(null);
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
                compState
            ] = await Promise.all([
                fetchTeamsFromSupabase('minimal'),
                fetchLiveSessionsFromSupabase(),
                fetchCompetitionsFromSupabase(),
                getCompetitionState()
            ]);

            if (!isMounted) return;

            setCompetitions(remoteComps);
            setCompState(compState);

            const myTeam = teams.find(t => t.id === currentSession.teamId);

            if (myTeam) {
                // Determine team order
                const compTeams = teams.filter(t => t.competition === myTeam.competition);
                const myIdx = compTeams.findIndex(t => t.id === myTeam.id);
                setTeamData({ ...myTeam, order: myIdx + 1 });

                // Check for live session in my competition
                // Robust lookup: Resolve myTeam.competition (which could be UUID or slug) to the actual DB UUID
                const relevantComp = remoteComps.find((c: Competition) => c.id === myTeam.competition || c.type === myTeam.competition);

                // We check BOTH the UUID and the Type (slug) in the sessions map
                const session = (relevantComp?.id && sessions[relevantComp.id])
                    || (relevantComp?.type && sessions[relevantComp.type])
                    || (myTeam.competition && sessions[myTeam.competition]);

                if (session) {
                    setCurrentPhase(session.phase);
                    setIsLiveForMyComp(true);

                    const activeTeamId = session.teamId;
                    const activeTeam = teams.find(t => t.id === activeTeamId);

                    if (activeTeam) {
                        const currentIdx = compTeams.findIndex(t => t.id === activeTeamId);
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
                    // Not live logic
                    setIsLiveForMyComp(false);
                }
            }

            setLoading(false);
        };

        fetchInitialData();

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
