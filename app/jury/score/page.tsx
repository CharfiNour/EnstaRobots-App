"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, CheckCircle, Info, ClipboardCheck, Target, ShieldAlert
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calculateTotalPoints } from '@/lib/offlineScores';
import { getTeams, Team } from '@/lib/teams';
import { startLiveSession, stopLiveSession, getCompetitionState, updateCompetitionState } from '@/lib/competitionState';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { updateCompetitionToSupabase, fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase, fetchScoresFromSupabase, pushScoreToSupabase } from '@/lib/supabaseData';

// Local project structure imports
import {
    CompetitionSelector,
    JuryInputs,
    PerformanceDataForm,
    TeamSelectSection,
    HeaderActions,
    HomologationForm,
    DrawSystem,
    LineFollowerScoreDialog
} from './components';
import {
    COMPETITION_CATEGORIES,
    STATUS_OPTIONS,
    generateId,
    getPhasesForCategory,
    getCategoryMetadata,
    LEGACY_ID_MAP
} from '@/lib/constants';
import { TeamScoreEntry } from '../types';

const checkIsLineFollower = (compId: string) => compId.includes('line_follower');

/**
 * HELPER: Robustly resolve any competition identifier to a canonical slug
 */
function canonicalizeCompId(id: string | undefined, dbComps: any[] = []): string {
    if (!id) return '';
    const norm = id.toLowerCase().trim();

    // 1. Check local categories first (Slugs)
    const local = COMPETITION_CATEGORIES.find(c => c.id === norm || c.type === norm);
    if (local) return local.type;

    // 2. Check Database records if available
    const db = (dbComps || []).find(c => (c.id || '').toLowerCase() === norm || (c.type || '').toLowerCase() === norm);
    if (db?.type) return db.type;

    // 3. LEGACY Map fallback
    for (const [slug, legacyId] of Object.entries(LEGACY_ID_MAP)) {
        if (legacyId === norm || slug === norm) return slug;
    }

    return norm;
}

export default function ScoreCardPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [success, setSuccess] = useState(false);
    const [showCompList, setShowCompList] = useState(false);
    const router = useRouter();
    const liveActionLock = useRef(false);
    const lastEndMatchTimestamp = useRef<Record<string, number>>({});

    // Juries
    const [jury1, setJury1] = useState('');
    const [jury2, setJury2] = useState('');
    const [jury3, setJury3] = useState('');
    const [availableJuries, setAvailableJuries] = useState<string[]>([]);

    // Competition Context
    const [competition, setCompetition] = useState<any>(COMPETITION_CATEGORIES[2]); // Default to Line Follower
    const [globalPhase, setGlobalPhase] = useState('Qualifications');

    // Teams State
    const [numberOfTeams, setNumberOfTeams] = useState(2);
    const [teams, setTeams] = useState<TeamScoreEntry[]>([
        { id: '', phase: 'Essay 1' },
    ]);

    // New Team Ordering & Live Logic
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [competitionTeams, setCompetitionTeams] = useState<Team[]>([]);
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
    const [isLive, setIsLive] = useState(false);
    const [competitionsFromSupabase, setCompetitionsFromSupabase] = useState<any[]>([]);
    const [allScores, setAllScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('GROUP 1');

    // Performance fields
    const [timeMinutes, setTimeMinutes] = useState('');
    const [timeSeconds, setTimeSeconds] = useState('');
    const [timeMillis, setTimeMillis] = useState('');
    const [completedRoad, setCompletedRoad] = useState(false);
    const [homologationPoints, setHomologationPoints] = useState('');
    const [knockouts, setKnockouts] = useState('');
    const [juryPoints, setJuryPoints] = useState('');
    const [damageScore, setDamageScore] = useState('');
    const [detailedScores, setDetailedScores] = useState<Record<string, number>>({});
    const [scoringMode, setScoringMode] = useState<'performance' | 'homologation'>('performance');
    const [homologationScores, setHomologationScores] = useState<Record<string, number>>({});
    const [homologationRemarks, setHomologationRemarks] = useState('');
    const [localHomoActive, setLocalHomoActive] = useState(false);
    const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
    const [scoringTeamIndex, setScoringTeamIndex] = useState<number | null>(null);

    const isLineFollowerMode = ['line_follower', 'junior_line_follower'].includes(competition.id);
    const isAllTerrainMode = ['all_terrain', 'junior_all_terrain'].includes(competition.id);
    const isHomo = scoringMode === 'homologation';
    const isUnlocked = isHomo ? localHomoActive : isLive;

    useEffect(() => {
        // Reset states immediately when competition changes
        setSwitching(true);
        setIsLive(false);
        setTeams([{ id: '', phase: checkIsLineFollower(competition.id) ? 'Essay 1' : (globalPhase || 'Qualifiers') }]);

        const loadInitialData = async () => {
            const [remoteTeams, remoteComps, remoteScores] = await Promise.all([
                fetchTeamsFromSupabase(),
                fetchCompetitionsFromSupabase(),
                fetchScoresFromSupabase(true)
            ]);
            setAllTeams(remoteTeams);
            setCompetitionsFromSupabase(remoteComps);
            setAllScores(remoteScores);
        };

        loadInitialData();

        if (!competition) {
            setSwitching(false);
            return;
        }

        // Sync Live State
        const syncState = () => {
            if (liveActionLock.current) return;

            const state = getCompetitionState();
            const stateLiveSessions = state.liveSessions || {};
            const liveSess = stateLiveSessions[competition.id];

            // Only update isLive if we are NOT currently fetching the new truth
            const isCompLive = !!liveSess;
            setIsLive(prev => prev === isCompLive ? prev : isCompLive);

            if (isCompLive && liveSess.teamId) {
                setTeams(prev => {
                    const sameId = prev[0] && prev[0].id === liveSess.teamId;
                    const samePhase = checkIsLineFollower(competition.id) ? prev[0].phase === liveSess.phase : true;
                    if (sameId && samePhase) return prev;

                    const copy = [...prev];
                    copy[0] = { ...copy[0], id: liveSess.teamId };
                    if (liveSess.phase) copy[0].phase = liveSess.phase;
                    return copy;
                });
            }
        };

        syncState();
        window.addEventListener('competition-state-updated', syncState);

        // Initial fetch from supabase - ALWAYS FORCE REFRESH when switching competition
        fetchLiveSessionsFromSupabase(true).then(sessions => {
            if (sessions) {
                updateCompetitionState({ liveSessions: sessions }, false);
            }
            setSwitching(false);
        }).catch(() => setSwitching(false));

        return () => {
            window.removeEventListener('competition-state-updated', syncState);
        };
    }, [competition.id, competition.type]);

    const handleRealtimeUpdate = async () => {
        // If we are actively starting/stopping a match, ignore background syncs
        // to avoid the "flinch" (old state overwriting local state via Supabase)
        if (liveActionLock.current) return;

        const sessions = await fetchLiveSessionsFromSupabase(true); // FORCE bypass cache
        const state = getCompetitionState();
        const globalTerminationMap = state.terminationTimestamps || {};

        const filtered: Record<string, any> = { ...sessions };
        for (const [compId, sess] of Object.entries(filtered)) {
            const manualEnd = lastEndMatchTimestamp.current[compId] || globalTerminationMap[compId] || 0;

            if (manualEnd && sess.startTime && sess.startTime < manualEnd) {
                console.log(`🛡️ [GUARD] Blocking stale session for ${compId} (Server Start: ${sess.startTime} < Local End: ${manualEnd})`);
                delete filtered[compId];
            }
        }

        updateCompetitionState({ liveSessions: filtered }, false);
    };

    const handleTeamsUpdate = async () => {
        const remoteTeams = await fetchTeamsFromSupabase();
        setAllTeams(remoteTeams);
    };

    const handleScoresUpdate = useCallback(async () => {
        const scores = await fetchScoresFromSupabase(true); // Force refresh to see new scores immediately
        setAllScores(scores);
    }, []);

    useSupabaseRealtime('live_sessions', handleRealtimeUpdate);
    useSupabaseRealtime('teams', handleTeamsUpdate);
    useSupabaseRealtime('scores', handleScoresUpdate);

    // Derived phases & groups
    const competitionPhases = useMemo(() => {
        return getPhasesForCategory(competition.id);
    }, [competition]);

    const availableGroupsMap = useMemo(() => {
        if (isLineFollowerMode) return new Map();

        // 1. Identify all matches for this competition type + phase
        const relevantScores = allScores.filter(s => {
            const scoreComp = canonicalizeCompId(s.competitionType, competitionsFromSupabase);
            const targetComp = canonicalizeCompId(competition.id, competitionsFromSupabase);
            return scoreComp === targetComp && s.phase === globalPhase && s.matchId;
        });

        // 2. Group by matchId and track latest timestamp and participant count
        const matchDataMap = new Map<string, { teamIds: string[], latestTimestamp: number }>();

        // SORTING: Ensure scores are processed in creation order (Draw Order)
        // This guarantees that teamIds are pushed to the group in a deterministic order (Team 1, Team 2...)
        // reducing "slot shuffling" and keeping the UI consistent with the sidebar.
        relevantScores.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        relevantScores.forEach(s => {
            if (!matchDataMap.has(s.matchId)) {
                matchDataMap.set(s.matchId, { teamIds: [], latestTimestamp: 0 });
            }
            const data = matchDataMap.get(s.matchId)!;
            // DEDUPLICATION: Prevent same team from appearing twice in the group
            if (!data.teamIds.includes(s.teamId)) {
                data.teamIds.push(s.teamId);
            }
            if (s.timestamp > data.latestTimestamp) data.latestTimestamp = s.timestamp;
        });

        // 3. Create sorted list of matches
        const sortedMatches = Array.from(matchDataMap.entries()).sort((a, b) => {
            const dataA = a[1];
            const dataB = b[1];

            // Primary: Match Size (Descending)
            if (dataB.teamIds.length !== dataA.teamIds.length) {
                return dataB.teamIds.length - dataA.teamIds.length;
            }

            // STABILITY FIX: Remove timestamp sorting. 
            // We sort purely by Match ID to ensure "GROUP 1" always refers to the same set of teams,
            // preventing the UI from "shuffling" groups after a submission updates the timestamp.
            return a[0].localeCompare(b[0]);
        });

        // 4. Create display map (GROUP 1, GROUP 2...) based on the consistent sort
        const displayMap = new Map<string, { id: string, label: string, teamIds: string[] }>();

        sortedMatches.forEach((match, idx) => {
            const mId = match[0];
            const data = match[1];
            const label = `GROUP ${idx + 1}`;
            displayMap.set(label, {
                id: mId,
                label: label,
                teamIds: data.teamIds
            });
        });

        return displayMap;
    }, [allScores, competition.id, globalPhase, isLineFollowerMode, competitionsFromSupabase]);

    const availableGroups = useMemo(() => {
        const keys = Array.from(availableGroupsMap.keys());
        return keys.length > 0 ? keys : ['GROUP 1'];
    }, [availableGroupsMap]);

    // Update selectedGroup if it becomes invalid
    useEffect(() => {
        if (!availableGroups.includes(selectedGroup)) {
            setSelectedGroup(availableGroups[0] || 'GROUP 1');
        }
    }, [availableGroups, selectedGroup]);

    useEffect(() => {
        const groupData = availableGroupsMap.get(selectedGroup);
        const targetCategory = canonicalizeCompId(competition.id, competitionsFromSupabase);

        const filtered = allTeams.filter(t => {
            if (!t.competition) return false;

            const teamCategory = canonicalizeCompId(t.competition, competitionsFromSupabase);
            if (teamCategory !== targetCategory) return false;

            // Apply group filter for non-line-follower (but ignore during homologation)
            if (!isLineFollowerMode && !isHomo && groupData) {
                return groupData.teamIds.includes(t.id);
            }
            return true;
        });

        // SORTING: Ensure teams are ordered consistently (alphabetical/numerical)
        const sortedFiltered = [...filtered].sort((a, b) => {
            const nameA = (a.robotName || a.name || '').toLowerCase();
            const nameB = (b.robotName || b.name || '').toLowerCase();
            return nameA.localeCompare(nameB, undefined, { numeric: true });
        });
        setCompetitionTeams(sortedFiltered);

        // For non-line-follower: Auto-add all teams from the group (but ignore during homologation)
        if (!isLineFollowerMode && !isHomo && groupData && groupData.teamIds.length > 0) {
            const currentIds = teams.map(t => t.id);
            if (JSON.stringify(currentIds) !== JSON.stringify(groupData.teamIds)) {
                const groupTeams = groupData.teamIds.map((tId: string) => {
                    const existingScore = allScores.find(s =>
                        s.teamId === tId &&
                        canonicalizeCompId(s.competitionType, competitionsFromSupabase) === targetCategory &&
                        s.phase === globalPhase
                    );
                    return {
                        id: tId,
                        status: existingScore?.status || 'pending'
                    };
                });
                setTeams(groupTeams as any);
                setNumberOfTeams(groupData.teamIds.length);
            }
        }

        // For line-follower: Smart pre-fill with the "Next" team that hasn't completed their turn
        if (isLineFollowerMode && sortedFiltered.length > 0 && !isLive) {
            // Only auto-fill if the current selection is empty OR already submitted
            const currentTeamId = teams[0]?.id;
            const currentPhase = teams[0]?.phase;
            const isCurrentSubmitted = currentTeamId && isPhaseSubmitted(currentTeamId, currentPhase || 'Essay 1');

            if (!currentTeamId || isCurrentSubmitted) {
                let nextAvailable = sortedFiltered[0];
                let targetPhase = 'Essay 1';

                // 1. Try to find first team missing Essay 1
                const teamMissing1 = sortedFiltered.find(t => !isPhaseSubmitted(t.id, 'Essay 1'));
                if (teamMissing1) {
                    nextAvailable = teamMissing1;
                    targetPhase = 'Essay 1';
                } else {
                    // 2. Find first team missing Essay 2
                    const teamMissing2 = sortedFiltered.find(t => !isPhaseSubmitted(t.id, 'Essay 2'));
                    if (teamMissing2) {
                        nextAvailable = teamMissing2;
                        targetPhase = 'Essay 2';
                    }
                }

                const newIndex = sortedFiltered.findIndex(t => t.id === nextAvailable.id);
                if (teams[0].id !== nextAvailable.id || teams[0].phase !== targetPhase) {
                    setCurrentTeamIndex(newIndex >= 0 ? newIndex : 0);
                    const newTeams = [...teams];
                    newTeams[0] = { ...newTeams[0], id: nextAvailable.id, phase: targetPhase };
                    setTeams(newTeams);
                }
            }
        }
    }, [competition, allTeams, allScores, isLive, isLineFollowerMode, isHomo, competitionsFromSupabase, selectedGroup, availableGroupsMap, teams[0]?.id, teams[0]?.phase]);

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || (currentSession.role !== 'jury' && currentSession.role !== 'homologation_jury')) {
            router.push('/auth/jury');
            return;
        }
        setSession(currentSession);

        // Auto-set scoring mode for homologation jury
        if (currentSession.role === 'homologation_jury') {
            setScoringMode('homologation');
        }

        setLoading(false);

        // Lock competition and load judges if assigned
        if (currentSession.competition && competitionsFromSupabase.length > 0) {
            // Find competition by ID (UUID) or by slug (value)
            const compFromDb = competitionsFromSupabase.find((c: any) => c.id === currentSession.competition || c.type === currentSession.competition);

            if (compFromDb) {
                const assignedComp = COMPETITION_CATEGORIES.find((c: any) => c.id === compFromDb.type || c.type === compFromDb.type);
                if (assignedComp) {
                    setCompetition(assignedComp);

                    // Fetch available juries for this competition
                    // (Local storage loading removed for security/sync compliance)
                    // Future enhancement: Fetch from Supabase directly if needed.
                    setAvailableJuries([]);
                }
            }
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [router, competitionsFromSupabase]);

    // Logic for single vs multi-team based on competition
    useEffect(() => {
        if (scoringMode === 'homologation') {
            setNumberOfTeams(1);
            return;
        }

        if (isLineFollowerMode) {
            setTeams([{ id: '', phase: 'Essay 1' }]);
        } else {
            // Initializing with group logic will be handled by the other useEffect
            setGlobalPhase('Qualifications');
        }
    }, [competition, isLineFollowerMode, scoringMode]);

    useEffect(() => {
        if (isLive && !isLineFollowerMode && teams[0]?.id) {
            const state = getCompetitionState();
            const liveSess = state.liveSessions[competition.id];

            // Only update if the phase is actually different to avoid loops
            if (liveSess && liveSess.phase !== globalPhase) {
                startLiveSession(teams[0].id, competition.id, globalPhase);
            }
        }
    }, [globalPhase, isLive, isLineFollowerMode, competition.id, teams]);

    // Update number of teams for non-LF
    useEffect(() => {
        if (!isLineFollowerMode) {
            // SAFEGUARD: If groups are active, strictly disable 'Count' based auto-expansion.
            // This prevents "slot multiplication" when groups reorder or change size.
            if (availableGroups.length > 0 && !isHomo) return;

            if (numberOfTeams !== teams.length) {
                const newTeams = [...teams];
                if (numberOfTeams > newTeams.length) {
                    while (newTeams.length < numberOfTeams) {
                        newTeams.push({ id: '', status: 'pending' });
                    }
                } else if (numberOfTeams < newTeams.length) {
                    newTeams.splice(numberOfTeams);
                }
                setTeams(newTeams);
            }
        }
    }, [numberOfTeams, isLineFollowerMode, teams.length]); // Use teams.length as dependency instead of teams array reference

    const handleNextCard = () => {
        if (competitionTeams.length === 0) return;

        let nextIndex = currentTeamIndex + 1;
        if (nextIndex >= competitionTeams.length) {
            alert("End of team list reached.");
            return;
        }

        liveActionLock.current = true;
        setCurrentTeamIndex(nextIndex);
        const nextTeam = competitionTeams[nextIndex];

        const newTeams = [...teams];
        newTeams[0].id = nextTeam.id;

        // Auto update phase if line follower
        if (isLineFollowerMode) {
            const hasEssay1 = allScores.some(s =>
                s.teamId === nextTeam.id &&
                canonicalizeCompId(s.competitionType, competitionsFromSupabase) === canonicalizeCompId(competition.id, competitionsFromSupabase) &&
                s.phase === 'Essay 1'
            );
            newTeams[0].phase = hasEssay1 ? 'Essay 2' : 'Essay 1';
        }

        setTeams(newTeams);

        if (isLive && !isHomo) {
            const phase = isLineFollowerMode ? (newTeams[0].phase || 'Essay 1') : globalPhase;
            startLiveSession(newTeams[0].id, competition.id, phase);
        }

        setTimeout(() => {
            liveActionLock.current = false;
        }, 3000);
    };

    const [starting, setStarting] = useState(false);

    const handleStartMatch = async () => {
        // Find current team ID being scored (first input team)
        const activeTeamId = teams[0].id;

        // EXCEPTION: Homologation allows unlocking first (to select team later)
        // For Live Matches, we MUST have a team selected to broadcast
        if (activeTeamId || isHomo) {
            console.log("🚀 Starting session for team:", activeTeamId || "(Pending Selection)");
            setStarting(true);
            liveActionLock.current = true;

            try {
                let phase = isLineFollowerMode ? (teams[0].phase || 'Essay 1') : globalPhase;

                // If current phase is complete, auto-advance to next phase if it exists
                if (isPhaseComplete && nextPhaseLabel && !isHomo) {
                    phase = nextPhaseLabel;
                    if (isLineFollowerMode) {
                        const newTeams = [...teams];
                        newTeams[0].phase = nextPhaseLabel;
                        setTeams(newTeams);
                    } else {
                        setGlobalPhase(nextPhaseLabel);
                    }
                }

                if (isHomo) {
                    setLocalHomoActive(true);
                } else {
                    // Safety: Double check we have a team for live mode
                    if (!activeTeamId) {
                        alert("Protocol Violation: No team selected for deployment.");
                        setStarting(false);
                        return;
                    }

                    // OPTIMISTIC UPDATE: Set live locally first
                    setIsLive(true);
                    // Perform remote registration
                    await startLiveSession(activeTeamId, competition.id, phase);
                }
            } catch (err) {
                console.error("Background sync failure for start:", err);
                // We keep it live locally so they can still type scores
            } finally {
                setStarting(false);
                setTimeout(() => { liveActionLock.current = false; }, 4000);
            }
        } else {
            alert("Protocol Violation: No team selected for deployment.");
        }
    };

    const handleEndMatch = async () => {
        setStopping(true);
        liveActionLock.current = true;
        // Mark termination time for the mutation guard
        lastEndMatchTimestamp.current[competition.id] = Date.now();

        console.log("🏁 Finalizing score session for:", competition.id);

        try {
            // Mark the current phase as completed on the public board
            const currentPhaseVal = isLineFollowerMode ? (teams[0].phase || 'Essay 1') : globalPhase;
            const phaseLabel = competitionPhases.find(p => p === currentPhaseVal) || currentPhaseVal;

            if (isHomo) {
                setLocalHomoActive(false);
            } else {
                // OPTIMISTIC UPDATE: Stop the session locally first to unblock UI
                setIsLive(false);

                // Execute network updates in parallel sans critical block
                const stopRemotePromise = stopLiveSession(competition.id);
                const updateStatusPromise = updateCompetitionToSupabase(competition.id, { current_phase: `${phaseLabel} Completed` });

                await Promise.all([stopRemotePromise, updateStatusPromise]).catch(err => {
                    console.warn("Background network sync partial failure:", err);
                });
            }

        } catch (err) {
            console.error("Failed to stop session properly:", err);
            alert("Local session stopped. Network sync failed, but data is preserved.");
            setIsLive(false);
            await stopLiveSession(competition.id).catch(() => { });
        } finally {
            setStopping(false);
            // Re-sync local storage derived state one last time to be sure
            const state = getCompetitionState();
            if (state.liveSessions && !state.liveSessions[competition.id]) {
                setIsLive(false);
            }
            // Give more buffer for the database update to propagate and other clients to receive changes
            setTimeout(() => { liveActionLock.current = false; }, 4000);
        }
    };

    const handleTeamChange = (index: number, field: string, value: any) => {
        liveActionLock.current = true;
        const newTeams = [...teams] as TeamScoreEntry[];
        const val = (field === 'rank' || field === 'timeMs') ? parseInt(value) || 0 : value;
        newTeams[index] = { ...newTeams[index], [field]: val };

        // Maintain global index for next/prev logic
        if (field === 'id' && index === 0) {
            const newIndex = competitionTeams.findIndex(t => t.id === value);
            if (newIndex >= 0) setCurrentTeamIndex(newIndex);
        }

        // If it's a Line Follower and the ID changed, check for existing Essay 1
        if (isLineFollowerMode && field === 'id' && value.trim() !== '') {
            const hasEssay1 = allScores.some(s =>
                s.teamId === value &&
                canonicalizeCompId(s.competitionType, competitionsFromSupabase) === canonicalizeCompId(competition.id, competitionsFromSupabase) &&
                s.phase === 'Essay 1'
            );
            newTeams[index].phase = hasEssay1 ? 'Essay 2' : 'Essay 1';
        }

        setTeams(newTeams);

        // Immediate Live Sync if the first team (active team) changes
        if (isUnlocked && !isHomo && index === 0 && (field === 'id' || field === 'phase')) {
            const activeId = field === 'id' ? value : newTeams[0].id;
            const phase = isLineFollowerMode ? (field === 'phase' ? value : newTeams[0].phase) : globalPhase;
            if (activeId) {
                startLiveSession(activeId, competition.id, phase!);
            }
        }

        // Release lock after a delay to allow Supabase to settle
        setTimeout(() => {
            liveActionLock.current = false;
        }, 2000);
    };

    const handleOpenScoreDialog = (index: number) => {
        setScoringTeamIndex(index);
        setScoreDialogOpen(true);
    };

    const handleSaveTeamScores = (scores: Record<string, number>) => {
        if (scoringTeamIndex === null) return;
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        handleTeamChange(scoringTeamIndex, 'detailedScores', scores);
        handleTeamChange(scoringTeamIndex, 'totalTaskPoints', total);
        setScoreDialogOpen(false);
    };


    const isPhaseSubmitted = useCallback((teamId: string, phase: string): boolean => {
        if (!teamId || !phase) return false;

        const normComp = (competition?.id || '').toLowerCase();
        const normPhase = (phase || '').toLowerCase();

        if (!normComp || !normPhase) return false;

        // Offline check removed as per request. Only rely on remote scores.

        const hasRemote = allScores.some(s =>
            s.teamId === teamId &&
            ((s.competitionType || '').toLowerCase() === normComp) &&
            (s.phase || '').toLowerCase() === normPhase &&
            s.status !== 'pending'
        );

        return hasRemote;
    }, [competition?.id, allScores]);

    // Check if the current phase is completed (Globally for the competition)
    const isPhaseComplete = useMemo(() => {
        if (isHomo) {
            if (teams.length === 0 || !teams[0].id) return false;
            return isPhaseSubmitted(teams[0].id, 'Homologation');
        }

        const targetCategory = canonicalizeCompId(competition.id, competitionsFromSupabase);

        if (isLineFollowerMode) {
            const targetPhase = teams[0]?.phase || 'Essay 1';
            const compTeams = allTeams.filter(t => canonicalizeCompId(t.competition, competitionsFromSupabase) === targetCategory);
            if (compTeams.length === 0) return false;
            return compTeams.every(t => isPhaseSubmitted(t.id, targetPhase));
        } else {
            // For matches: Check all scores generated for this phase. 
            // If any match is still 'pending', the phase is not complete.
            const currentPhaseScores = allScores.filter(s =>
                canonicalizeCompId(s.competitionType, competitionsFromSupabase) === targetCategory &&
                s.phase === globalPhase
            );
            if (currentPhaseScores.length === 0) return false;
            return currentPhaseScores.every(s => s.status !== 'pending');
        }
    }, [allTeams, allScores, competition.id, globalPhase, isLineFollowerMode, isHomo, isPhaseSubmitted, teams, competitionsFromSupabase]);

    const nextPhaseLabel = useMemo(() => {
        if (isHomo) return null;
        const currentPhase = isLineFollowerMode ? (teams[0]?.phase || 'Essay 1') : globalPhase;
        const phases = competitionPhases;
        const idx = phases.indexOf(currentPhase);
        if (idx !== -1 && idx < phases.length - 1) {
            return phases[idx + 1];
        }
        return null;
    }, [isHomo, isLineFollowerMode, teams, globalPhase, competitionPhases]);

    const isPhaseDrawn = useMemo(() => {
        if (isLineFollowerMode || isHomo) return true; // LF and Homo don't use draws
        const targetCategory = canonicalizeCompId(competition.id, competitionsFromSupabase);
        return allScores.some(s =>
            canonicalizeCompId(s.competitionType, competitionsFromSupabase) === targetCategory &&
            s.phase === globalPhase
        );
    }, [allScores, competition.id, globalPhase, isLineFollowerMode, isHomo, competitionsFromSupabase]);

    const prevPhase = useMemo(() => {
        const idx = competitionPhases.indexOf(globalPhase);
        return idx > 0 ? competitionPhases[idx - 1] : null;
    }, [competitionPhases, globalPhase]);

    const isPrevPhaseFinished = useMemo(() => {
        if (isLineFollowerMode || isHomo || !prevPhase) return true;

        const targetCategory = canonicalizeCompId(competition.id, competitionsFromSupabase);
        const prevPhaseScores = allScores.filter(s =>
            canonicalizeCompId(s.competitionType, competitionsFromSupabase) === targetCategory &&
            s.phase === prevPhase
        );

        if (prevPhaseScores.length === 0) return false;

        // Implementation detail: If any "pending" scores remain in prev phase, it's not finished
        return prevPhaseScores.every(s => s.status !== 'pending');
    }, [prevPhase, allScores, competition.id, isLineFollowerMode, isHomo, competitionsFromSupabase]);

    const eligibleTeams = useMemo(() => {
        if (isLineFollowerMode || isHomo) return [];

        if (!prevPhase) {
            // First phase (Qualifications): all registered teams
            const targetCategory = canonicalizeCompId(competition.id, competitionsFromSupabase);
            return allTeams.filter(t => canonicalizeCompId(t.competition, competitionsFromSupabase) === targetCategory);
        }

        // Subsequent phases: winners/qualified from prevPhase
        const targetCategory = canonicalizeCompId(competition.id, competitionsFromSupabase);
        const winners = allScores.filter(s =>
            canonicalizeCompId(s.competitionType, competitionsFromSupabase) === targetCategory &&
            s.phase === prevPhase &&
            (s.status === 'winner' || s.status === 'qualified')
        ).map(s => s.teamId);

        return allTeams.filter(t => winners.includes(t.id));
    }, [prevPhase, allTeams, allScores, competition.id, isLineFollowerMode, isHomo, competitionsFromSupabase]);

    const handleDrawComplete = () => {
        handleScoresUpdate();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(false);

        // Check for duplicate phase submissions and ensure team selection
        for (const team of teams) {
            if (!team.id) {
                alert("Protocol Violation: One or more units are undefined in the tactical grid.");
                setSubmitting(false);
                return;
            }

            const phaseToCheck = scoringMode === 'homologation' ? 'Homologation' : (isLineFollowerMode ? team.phase : globalPhase);
            if (isPhaseSubmitted(team.id, phaseToCheck!)) {
                alert(`Team identified as ${team.id} has already submitted a score for ${phaseToCheck?.replace(/_/g, ' ')}. Please select a different phase or team.`);
                setSubmitting(false);
                return;
            }
        }

        const groupData = availableGroupsMap.get(selectedGroup);
        const matchId = groupData ? groupData.id : `match_${generateId()}`;
        const totalTimeMs = isLineFollowerMode ?
            (parseInt(timeMinutes || '0') * 60000) + (parseInt(timeSeconds || '0') * 1000) + parseInt(timeMillis || '0')
            : undefined;

        const payloads = teams.map(team => {
            const isHomo = scoringMode === 'homologation';
            const totalHomo = Object.values(homologationScores).reduce((a, b) => a + b, 0);

            const teamTimeMs = isAllTerrainMode ?
                (parseInt(team.timeMinutes || '0') * 60000) + (parseInt(team.timeSeconds || '0') * 1000) + parseInt(team.timeMillis || '0')
                : (isLineFollowerMode ? totalTimeMs : undefined);

            const isJuniorAT = competition.id === 'junior_all_terrain';
            const bonuses = (isLineFollowerMode || isJuniorAT) && homologationPoints ? parseInt(homologationPoints) : 0;
            const kos = !isLineFollowerMode && !isJuniorAT && knockouts ? parseInt(knockouts) : 0;
            const jpts = !isLineFollowerMode && !isJuniorAT && juryPoints ? parseInt(juryPoints) : 0;
            const dmg = !isLineFollowerMode && !isJuniorAT && damageScore ? parseInt(damageScore) : 0;

            const score = isHomo ? totalHomo : calculateTotalPoints(competition.id, {
                timeMs: teamTimeMs,
                bonusPoints: bonuses,
                knockouts: kos,
                juryPoints: jpts,
                damageScore: dmg
            });

            return {
                id: generateId(),
                matchId,
                teamId: team.id,
                competitionType: competition.id,
                phase: isHomo ? 'Homologation' : (isLineFollowerMode ? team.phase : globalPhase),
                juryId: session.userId,
                juryNames: [jury1, jury2, jury3],
                timeMs: isHomo ? undefined : teamTimeMs,
                rank: team.rank,
                completedRoad: isLineFollowerMode ? completedRoad : undefined,
                bonusPoints: isHomo ? totalHomo : bonuses,
                knockouts: isHomo ? undefined : kos,
                juryPoints: isHomo ? undefined : jpts,
                damageScore: isHomo ? undefined : dmg,
                penalties: 0,
                timestamp: Date.now(),
                totalPoints: score,
                detailedScores: isHomo ? homologationScores : (isLineFollowerMode || isJuniorAT ? { ...detailedScores, rank: team.rank } : { rank: team.rank }),
                remarks: isHomo ? homologationRemarks : undefined,
                isSentToTeam: true,
                status: isHomo ? 'validated' : (team.status || 'validated')
            };
        });

        // DIRECT PUSH: Send to Supabase immediately
        try {
            await Promise.all(payloads.map(payload => pushScoreToSupabase(payload as any)));
            setSuccess(true);
            handleScoresUpdate(); // Immediate local refresh
        } catch (err: any) {
            console.error("Push failed:", err);
            const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            alert(`Failed to save score: ${errorMsg}`);
            setSubmitting(false);
            return;
        }

        // Reset scores but keep judges
        setTimeMinutes(''); setTimeSeconds(''); setTimeMillis('');
        setCompletedRoad(false); setHomologationPoints('');
        setKnockouts(''); setJuryPoints(''); setDamageScore('');
        setDetailedScores({});
        setHomologationScores({});
        setHomologationRemarks('');

        // Advance to next team ONLY for Line Follower (One-by-One flow)
        if (isLineFollowerMode) {
            const nextIndex = currentTeamIndex + 1;
            if (nextIndex < competitionTeams.length) {
                setCurrentTeamIndex(nextIndex);
                const nextTeam = competitionTeams[nextIndex];
                const newTeams = [...teams];
                newTeams[0].id = nextTeam.id;

                // Auto update phase if line follower
                const hasEssay1 = allScores.some(s =>
                    s.teamId === nextTeam.id &&
                    canonicalizeCompId(s.competitionType, competitionsFromSupabase) === canonicalizeCompId(competition.id, competitionsFromSupabase) &&
                    s.phase === 'Essay 1'
                );
                newTeams[0].phase = hasEssay1 ? 'Essay 2' : 'Essay 1';

                setTeams(newTeams);

                // AUTO-SYNC NEXT TEAM TO PUBLIC BOARD
                if (isLive && !isHomo) {
                    const phase = newTeams[0].phase || 'Essay 1';
                    startLiveSession(newTeams[0].id, competition.id, phase);
                }
            } else {
                // End of list reached - only then do we terminate the session
                if (isLive || localHomoActive) {
                    handleEndMatch();
                }
                setTeams(teams.map(t => ({ ...t, id: '', phase: 'Essay 1' })));
            }
        } else {
            // Non-Line Follower (Group Matches): 
            // We consciously DO NOT reset the form here.
            // Keeping the submitted state visible allows the Jury to verify their submission.
            // The form will naturally reset when they select a different Group.
        }

        setTimeout(() => setSuccess(false), 3000);
        setSubmitting(false);

        // Background sync removed - data is pushed directly in handleSubmit
    };

    // Compute Team Order for Line Follower (Run Sequence)
    const teamsOrder = useMemo(() => {
        if (!isLineFollowerMode) return {};

        // Use remote scores only as requested
        const combined = allScores;

        // Use canonical ID for filtering
        const targetCategory = canonicalizeCompId(competition.id, competitionsFromSupabase);
        const relevantScores = combined.filter(s =>
        // Check both raw ID and canonical type
        (s.competitionType === competition.id ||
            canonicalizeCompId(s.competitionType, competitionsFromSupabase) === targetCategory)
        );

        if (relevantScores.length === 0) return {};

        // Sort by timestamp (Creation order = Run order) with tie-breakers
        const sorted = relevantScores.sort((a, b) => {
            if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
            if (a.matchId && b.matchId) return a.matchId.localeCompare(b.matchId, undefined, { numeric: true });
            return 0;
        });

        const order: Record<string, number> = {};
        let rank = 1;
        sorted.forEach(s => {
            const tKey = String(s.teamId);
            if (order[tKey] === undefined) order[tKey] = rank++;
        });
        return order;
    }, [allScores, competition.id, isLineFollowerMode, competitionsFromSupabase]);

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-2xl shadow-role-primary/40 ring-1 ring-white/20">
                            <ClipboardCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tighter uppercase italic leading-none mb-2">
                                Score Management
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                                <Target size={14} className="text-role-primary" />
                                Tactical Performance Entry & Registry Sync
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <HeaderActions
                    isLive={isUnlocked}
                    handleNextCard={handleNextCard}
                    handleEndMatch={handleEndMatch}
                    handleStartMatch={handleStartMatch}
                    isLineFollower={isLineFollowerMode}
                    teams={teams}
                    globalPhase={globalPhase}
                    competition={competition}
                    isPhaseComplete={isPhaseComplete}
                    nextPhaseLabel={nextPhaseLabel}
                    submitting={starting || submitting || stopping}
                    scoringMode={scoringMode}
                />
                {/* Competition Selector */}
                <CompetitionSelector
                    competition={competition}
                    setCompetition={setCompetition}
                    showCompList={showCompList}
                    setShowCompList={setShowCompList}
                    locked={!!session?.competition && session?.role !== 'homologation_jury'}
                    scoringMode={scoringMode}
                    setScoringMode={setScoringMode}
                    sessionRole={session?.role}
                />

                {/* Main Card */}
                <div className="bg-card border border-card-border rounded-2xl p-4 md:p-6 shadow-2xl relative min-h-[400px]">
                    {(loading || switching) ? (
                        <div className="space-y-6 animate-pulse">
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Tactical Data...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {(!isLineFollowerMode && !isHomo) ? (
                                // Match-based logic with Draw System
                                !isPhaseDrawn ? (
                                    <DrawSystem
                                        competitionId={competition.id}
                                        phase={globalPhase}
                                        eligibleTeams={eligibleTeams}
                                        onDrawComplete={handleDrawComplete}
                                        matchSize={numberOfTeams}
                                    />
                                ) : (
                                    /* Active Scorecard Form */
                                    <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity duration-300 ${!isUnlocked ? 'opacity-40 pointer-events-none' : ''}`}>
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                                                <div className="bg-card border border-card-border p-4 rounded-xl shadow-xl flex items-center gap-2 text-muted-foreground font-bold">
                                                    <Info size={18} />
                                                    <span>Press Start to unlock score card</span>
                                                </div>
                                            </div>
                                        )}

                                        <JuryInputs
                                            jury1={jury1} setJury1={setJury1}
                                            jury2={jury2} setJury2={setJury2}
                                            jury3={jury3} setJury3={setJury3}
                                            availableJuries={availableJuries}
                                            role={session?.role}
                                        />

                                        <div className="w-full h-px bg-card-border" />

                                        <TeamSelectSection
                                            isLineFollower={isLineFollowerMode}
                                            isAllTerrain={isAllTerrainMode}
                                            teams={teams}
                                            handleTeamChange={handleTeamChange}
                                            competitionTeams={competitionTeams}
                                            globalPhase={globalPhase}
                                            setGlobalPhase={setGlobalPhase}
                                            numberOfTeams={numberOfTeams}
                                            setNumberOfTeams={setNumberOfTeams}
                                            isPhaseSubmitted={isPhaseSubmitted}
                                            competitionPhases={competitionPhases}
                                            STATUS_OPTIONS={STATUS_OPTIONS}
                                            selectedGroup={selectedGroup}
                                            setSelectedGroup={setSelectedGroup}
                                            groups={availableGroups}
                                            scoringMode={scoringMode}
                                            teamsOrder={teamsOrder}
                                            onScoreClick={handleOpenScoreDialog}
                                            competitionId={competition.id}
                                        />

                                        {/* Performance Section */}
                                        {isHomo ? (
                                            <HomologationForm
                                                competitionType={competition.id}
                                                homologationScores={homologationScores}
                                                setHomologationScores={setHomologationScores}
                                                remarks={homologationRemarks}
                                                setRemarks={setHomologationRemarks}
                                            />
                                        ) : (
                                            <PerformanceDataForm
                                                isLineFollower={isLineFollowerMode}
                                                timeMinutes={timeMinutes} setTimeMinutes={setTimeMinutes}
                                                timeSeconds={timeSeconds} setTimeSeconds={setTimeSeconds}
                                                timeMillis={timeMillis} setTimeMillis={setTimeMillis}
                                                completedRoad={completedRoad} setCompletedRoad={setCompletedRoad}
                                                homologationPoints={homologationPoints} setHomologationPoints={setHomologationPoints}
                                                knockouts={knockouts} setKnockouts={setKnockouts}
                                                juryPoints={juryPoints} setJuryPoints={setJuryPoints}
                                                damageScore={damageScore} setDamageScore={setDamageScore}
                                                competitionType={competition.id}
                                                detailedScores={detailedScores}
                                                setDetailedScores={setDetailedScores}
                                            />
                                        )}

                                        {/* Submit Area */}
                                        {(() => {
                                            const targetPhase = isHomo ? 'Homologation' : (isLineFollowerMode ? (teams[0]?.phase || 'Essay 1') : globalPhase);
                                            const isSubmitted = teams.every(t => isPhaseSubmitted(t.id, targetPhase!));

                                            return (
                                                <button
                                                    type="submit"
                                                    disabled={submitting || isSubmitted || !isUnlocked}
                                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${submitting ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' :
                                                        isSubmitted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                                                            'bg-accent text-slate-950 hover:shadow-accent/20 hover:-translate-y-0.5'
                                                        }`}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Synchronizing...
                                                        </>
                                                    ) : isSubmitted ? (
                                                        <>
                                                            <CheckCircle className="w-5 h-5" />
                                                            Data Synchronized
                                                        </>
                                                    ) : (
                                                        'Submit Score Card'
                                                    )}
                                                </button>
                                            );
                                        })()}

                                        <LineFollowerScoreDialog
                                            isOpen={scoreDialogOpen}
                                            onClose={() => setScoreDialogOpen(false)}
                                            currentScores={scoringTeamIndex !== null ? (teams[scoringTeamIndex]?.detailedScores || {}) : {}}
                                            onSave={handleSaveTeamScores}
                                            competitionType={competition.id}
                                        />
                                    </form>
                                )
                            ) : (
                                /* Standard Line Follower / Homologation always show form */
                                <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity duration-300 ${!isUnlocked ? 'opacity-40 pointer-events-none' : ''}`}>
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                                            <div className="bg-card border border-card-border p-4 rounded-xl shadow-xl flex items-center gap-2 text-muted-foreground font-bold">
                                                <Info size={18} />
                                                <span>Press Start to unlock score card</span>
                                            </div>
                                        </div>
                                    )}

                                    <JuryInputs
                                        jury1={jury1} setJury1={setJury1}
                                        jury2={jury2} setJury2={setJury2}
                                        jury3={jury3} setJury3={setJury3}
                                        availableJuries={availableJuries}
                                        role={session?.role}
                                    />

                                    <div className="w-full h-px bg-card-border" />

                                    <TeamSelectSection
                                        isLineFollower={isLineFollowerMode}
                                        teams={teams}
                                        handleTeamChange={handleTeamChange}
                                        competitionTeams={competitionTeams}
                                        globalPhase={globalPhase}
                                        setGlobalPhase={setGlobalPhase}
                                        numberOfTeams={numberOfTeams}
                                        setNumberOfTeams={setNumberOfTeams}
                                        isPhaseSubmitted={isPhaseSubmitted}
                                        competitionPhases={competitionPhases}
                                        STATUS_OPTIONS={STATUS_OPTIONS}
                                        selectedGroup={selectedGroup}
                                        setSelectedGroup={setSelectedGroup}
                                        groups={availableGroups}
                                        scoringMode={scoringMode}
                                        teamsOrder={teamsOrder}
                                    />

                                    {/* Performance Section */}
                                    {isHomo ? (
                                        <HomologationForm
                                            competitionType={competition.id}
                                            homologationScores={homologationScores}
                                            setHomologationScores={setHomologationScores}
                                            remarks={homologationRemarks}
                                            setRemarks={setHomologationRemarks}
                                        />
                                    ) : (
                                        <PerformanceDataForm
                                            isLineFollower={isLineFollowerMode}
                                            timeMinutes={timeMinutes} setTimeMinutes={setTimeMinutes}
                                            timeSeconds={timeSeconds} setTimeSeconds={setTimeSeconds}
                                            timeMillis={timeMillis} setTimeMillis={setTimeMillis}
                                            completedRoad={completedRoad} setCompletedRoad={setCompletedRoad}
                                            homologationPoints={homologationPoints} setHomologationPoints={setHomologationPoints}
                                            knockouts={knockouts} setKnockouts={setKnockouts}
                                            juryPoints={juryPoints} setJuryPoints={setJuryPoints}
                                            damageScore={damageScore} setDamageScore={setDamageScore}
                                            competitionType={competition.id}
                                            detailedScores={detailedScores}
                                            setDetailedScores={setDetailedScores}
                                        />
                                    )}

                                    {/* Submit Area */}
                                    {(() => {
                                        const targetPhase = isHomo ? 'Homologation' : (isLineFollowerMode ? (teams[0]?.phase || 'Essay 1') : globalPhase);
                                        const isSubmitted = teams.every(t => isPhaseSubmitted(t.id, targetPhase!));

                                        return (
                                            <button
                                                type="submit"
                                                disabled={submitting || isSubmitted || !isUnlocked}
                                                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${submitting ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' :
                                                    isSubmitted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                                                        'bg-accent text-slate-950 hover:shadow-accent/20 hover:-translate-y-0.5'
                                                    }`}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Synchronizing...
                                                    </>
                                                ) : isSubmitted ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Data Synchronized
                                                    </>
                                                ) : (
                                                    'Submit Score Card'
                                                )}
                                            </button>
                                        );
                                    })()}
                                </form>
                            )}
                        </>
                    )}
                </div>

                {/* Success Indicator */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-green-500 text-white rounded-full shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-3 z-[100]"
                        >
                            <CheckCircle size={24} />
                            <span className="font-bold text-base">Results have been successfully logged!</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Bar */}
                <div className="mt-6 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            {isOnline ? 'Network: Online Optic' : 'Network: Offline Buffer'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
