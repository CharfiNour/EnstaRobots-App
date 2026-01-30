"use client";

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { getTeams, Team } from '@/lib/teams';
import { getCompetitionState, CompetitionState, updateCompetitionState } from '@/lib/competitionState';

export function useAdminMatches() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [compState, setCompState] = useState<CompetitionState | null>(null);
    const [currentTeam, setCurrentTeam] = useState<any>(null);
    const [nextTeam, setNextTeam] = useState<any>(null);
    const [nextPhase, setNextPhase] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchState = () => {
            const state = getCompetitionState();
            setCompState(state);

            const allTeams = getTeams();
            setTeams(allTeams);

            // Find first active session
            let activeTeamId: string | null = null;
            let currentPhase: string | null = null;

            if (state.liveSessions) {
                const sessions = Object.values(state.liveSessions);
                if (sessions.length > 0) {
                    activeTeamId = sessions[0].teamId;
                    currentPhase = sessions[0].phase;
                }
            }

            // Current Team
            if (activeTeamId) {
                const currentIdx = allTeams.findIndex(t => t.id === activeTeamId);
                if (currentIdx !== -1) {
                    setCurrentTeam({ ...allTeams[currentIdx], order: currentIdx + 1 });

                    // Next Team (Looping)
                    const nextIdx = (currentIdx + 1) % allTeams.length;
                    setNextTeam({ ...allTeams[nextIdx], order: nextIdx + 1 });

                    // Next Phase Logic
                    if (currentIdx === allTeams.length - 1) {
                        const phases = ['Qualifiers', 'Group Stage', 'Knockout', 'Finals'];
                        const currentPhaseIdx = phases.indexOf(currentPhase || 'Qualifiers');
                        const nextPhaseName = currentPhaseIdx !== -1 && currentPhaseIdx < phases.length - 1
                            ? phases[currentPhaseIdx + 1]
                            : 'Next Stage';
                        setNextPhase(nextPhaseName);
                    } else {
                        setNextPhase(null);
                    }
                }
            } else {
                setCurrentTeam(null);
                setNextTeam(null);
                setNextPhase(null);
            }
        };

        const allTeams = getTeams();
        setTeams(allTeams);
        if (allTeams.length > 0) {
            setSelectedTeamId(allTeams[0].id);
        }

        fetchState();
        setLoading(false);

        window.addEventListener('competition-state-updated', fetchState);
        return () => window.removeEventListener('competition-state-updated', fetchState);
    }, []);

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    const toggleLive = () => {
        if (!compState) return;
        updateCompetitionState({ isLive: !compState.isLive }, false);
    };

    return {
        teams,
        selectedTeam,
        selectedTeamId,
        setSelectedTeamId,
        compState,
        currentTeam,
        nextTeam,
        nextPhase,
        loading,
        toggleLive
    };
}
