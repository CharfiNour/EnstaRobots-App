import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { Team, Competition } from '@/lib/teams';
import { getCompetitionState, CompetitionState, syncEventDayStatusFromSupabase } from '@/lib/competitionState';
import { supabase } from '@/lib/supabase';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase, fetchScoresFromSupabase } from '@/lib/supabaseData';
import { canonicalizeCompId } from '@/lib/constants';

export function useMatchesPage() {
    const [clubTeams, setClubTeams] = useState<Team[]>([]);
    const [compState, setCompState] = useState<CompetitionState | null>(getCompetitionState());
    const [loading, setLoading] = useState(true);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
    const [liveSessions, setLiveSessions] = useState<Record<string, any>>({});
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [allScores, setAllScores] = useState<any[]>([]);

    const fetchInitialData = async () => {
        const currentSession = getSession();
        const clubName = currentSession?.clubName;

        if (!clubName) {
            setLoading(false);
            return;
        }

        const [
            teams,
            sessions,
            remoteComps,
            state,
            scores
        ] = await Promise.all([
            fetchTeamsFromSupabase('minimal'),
            fetchLiveSessionsFromSupabase(),
            fetchCompetitionsFromSupabase(),
            getCompetitionState(),
            fetchScoresFromSupabase()
        ]);

        const myClubTeams = teams.filter((t: any) =>
            t.club && clubName && t.club.trim().toLowerCase() === clubName.trim().toLowerCase()
        );

        setAllTeams(teams);
        setCompetitions(remoteComps);
        setCompState(state);
        setLiveSessions(sessions || {});
        setClubTeams(myClubTeams);
        setAllScores(scores);

        // Auto-select first competition if none selected
        if (!selectedCompId && myClubTeams.length > 0) {
            const firstValidComp = myClubTeams.find(t => t.competition)?.competition;
            if (firstValidComp) setSelectedCompId(firstValidComp);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchInitialData();

        const handleSync = () => {
            setCompState({ ...getCompetitionState() });
            fetchInitialData();
        };

        syncEventDayStatusFromSupabase().then(handleSync);
        window.addEventListener('competition-state-updated', handleSync);

        const channel = supabase
            .channel(`matches_realtime_${Math.random()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'live_sessions' },
                () => fetchInitialData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'scores' },
                () => fetchInitialData()
            )
            .subscribe();

        return () => {
            window.removeEventListener('competition-state-updated', handleSync);
            supabase.removeChannel(channel);
        };
    }, []);

    const selectedComp = competitions.find(c =>
        c.id === selectedCompId ||
        c.type === selectedCompId ||
        canonicalizeCompId(c.id, competitions) === canonicalizeCompId(selectedCompId, competitions)
    );

    const availableCompetitions = competitions.filter(c =>
        clubTeams.some(t => {
            const teamCanon = canonicalizeCompId(t.competition, competitions);
            const compCanon = canonicalizeCompId(c.id, competitions);
            return teamCanon === compCanon && teamCanon !== '';
        })
    );

    // Turn Logic
    const clubTeamsInSelection = clubTeams
        .filter(t => {
            if (!selectedCompId) return false;
            return canonicalizeCompId(t.competition, competitions) === canonicalizeCompId(selectedCompId, competitions);
        })
        .map(t => {
            const canonicalComp = canonicalizeCompId(t.competition, competitions);
            const compTeams = allTeams.filter(ot => canonicalizeCompId(ot.competition, competitions) === canonicalComp);
            const currentPhase = selectedComp?.current_phase || 'qualifications';

            // Is this a draw-based competition?
            const isDrawBased = ['all_terrain', 'junior_all_terrain', 'line_follower', 'junior_line_follower'].includes(canonicalComp);

            let myTurn = 0;
            let currentTurn = null;

            if (isDrawBased) {
                // Find pending scores for this phase to identify groups
                const phaseMatches = allScores.filter(s =>
                    s.competitionType === canonicalComp &&
                    s.phase === currentPhase &&
                    s.status === 'pending'
                );

                // Group scores by matchId
                const matches: Record<string, string[]> = {};
                phaseMatches.forEach(s => {
                    if (!matches[s.matchId]) matches[s.matchId] = [];
                    matches[s.matchId].push(s.teamId);
                });

                // Unique Match IDs in order (using scores array order which is usually sorted by creation/match_number)
                const orderedMatchIds = Array.from(new Set(phaseMatches.map(s => s.matchId)));

                // Find which match this team belongs to
                const myMatchId = Object.keys(matches).find(mId => matches[mId].includes(t.id));
                const matchIndex = myMatchId ? orderedMatchIds.indexOf(myMatchId) : -1;

                // FIX: If matchIndex is -1 and it's match based, it means draw hasn't happened or team not in draw
                myTurn = matchIndex !== -1 ? matchIndex + 1 : 0;

                // Calculate current turn from live session
                const session = liveSessions[canonicalComp];
                if (session) {
                    const activeMatchId = Object.keys(matches).find(mId => matches[mId].includes(session.teamId));
                    const activeMatchIndex = activeMatchId ? orderedMatchIds.indexOf(activeMatchId) : -1;
                    currentTurn = activeMatchIndex !== -1 ? activeMatchIndex + 1 : null;
                }
            } else {
                // Line Follower style: Incremental indexing
                myTurn = compTeams.findIndex(ot => ot.id === t.id) + 1;

                const session = liveSessions[canonicalComp];
                if (session) {
                    const activeIdx = compTeams.findIndex(ot => ot.id === session.teamId);
                    currentTurn = activeIdx !== -1 ? activeIdx + 1 : null;
                }
            }

            const session = liveSessions[canonicalComp];

            return {
                ...t,
                myTurn,
                currentTurn,
                isLive: (compState?.eventDayStarted ?? false) && session?.teamId === t.id,
                currentPhase: session?.phase || currentPhase
            };
        });

    return {
        clubTeams: clubTeamsInSelection,
        availableCompetitions,
        selectedCompId,
        setSelectedCompId,
        compState,
        loading,
        selectedComp,
        competitions,
        isCompetitionLive: (compState?.eventDayStarted ?? false) && !!liveSessions[canonicalizeCompId(selectedCompId, competitions)]
    };
}
