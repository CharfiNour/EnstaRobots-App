"use client";

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { getTeams } from '@/lib/teams';
import { getCompetitionState, CompetitionState } from '@/lib/competitionState';

export function useMatchesPage() {
    const [session, setSession] = useState<any>(null);
    const [teamData, setTeamData] = useState<any>(null);
    const [compState, setCompState] = useState<CompetitionState | null>(null);
    const [currentTeam, setCurrentTeam] = useState<any>(null);
    const [nextTeam, setNextTeam] = useState<any>(null);
    const [nextPhase, setNextPhase] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPhase, setCurrentPhase] = useState<string | null>(null);
    const [isLiveForMyComp, setIsLiveForMyComp] = useState(false);

    useEffect(() => {
        const fetchState = () => {
            const state = getCompetitionState();
            setCompState(state);

            const teams = getTeams();
            const currentSession = getSession();

            // Determine active context based on logged-in team's competition
            let activeTeamId: string | null = null;
            let phase: string | null = null;
            let isLive = false;

            if (currentSession?.teamId) {
                const myTeam = teams.find(t => t.id === currentSession.teamId);
                // Check if my competition has a live session
                if (myTeam && myTeam.competition && state.liveSessions && state.liveSessions[myTeam.competition]) {
                    const session = state.liveSessions[myTeam.competition];
                    activeTeamId = session.teamId;
                    phase = session.phase;
                    isLive = true;
                }
            }

            setCurrentPhase(phase);
            setIsLiveForMyComp(isLive);

            // Current Team Logic: Competition-weighted position
            if (activeTeamId) {
                const activeTeam = teams.find(t => t.id === activeTeamId);
                if (activeTeam) {
                    const compTeams = teams.filter(t => t.competition === activeTeam.competition);
                    const currentIdx = compTeams.findIndex(t => t.id === activeTeamId);

                    if (currentIdx !== -1) {
                        setCurrentTeam({ ...activeTeam, order: currentIdx + 1 });

                        const nextIdx = (currentIdx + 1) % compTeams.length;
                        setNextTeam({ ...compTeams[nextIdx], order: nextIdx + 1 });

                        if (currentIdx === compTeams.length - 1) {
                            const phases = ['Qualifiers', 'Group Stage', 'Knockout', 'Finals'];
                            const currentPhaseIdx = phases.indexOf(phase || 'Qualifiers');
                            const nextPhaseName = currentPhaseIdx !== -1 && currentPhaseIdx < phases.length - 1
                                ? phases[currentPhaseIdx + 1]
                                : 'Next Stage';
                            setNextPhase(nextPhaseName);
                        } else {
                            setNextPhase(null);
                        }
                    }
                }
            } else {
                setCurrentTeam(null);
                setNextTeam(null);
                setNextPhase(null);
            }
        };

        const currentSession = getSession();
        setSession(currentSession);

        if (currentSession?.teamId) {
            const teams = getTeams();
            const sessionTeam = teams.find(t => t.id === currentSession.teamId);
            if (sessionTeam) {
                const compTeams = teams.filter(t => t.competition === sessionTeam.competition);
                const teamIndex = compTeams.findIndex(t => t.id === sessionTeam.id);
                if (teamIndex !== -1) {
                    setTeamData({ ...sessionTeam, order: teamIndex + 1 });
                }
            }
        }

        fetchState();
        setLoading(false);

        window.addEventListener('competition-state-updated', fetchState);
        return () => window.removeEventListener('competition-state-updated', fetchState);
    }, []);

    return {
        session,
        teamData,
        compState,
        currentTeam,
        nextTeam,
        nextPhase,
        loading,
        currentPhase,
        isLive: isLiveForMyComp
    };
}
