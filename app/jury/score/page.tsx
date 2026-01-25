"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, CheckCircle, Info, ClipboardCheck, Target
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveScoreOffline, calculateTotalPoints, getOfflineScores } from '@/lib/offlineScores';
import { getTeams, Team } from '@/lib/teams';
import { startLiveSession, stopLiveSession, getCompetitionState, updateCompetitionState } from '@/lib/competitionState';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { updateCompetitionStatusToSupabase, fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase, fetchCompetitionsFromSupabase, fetchScoresFromSupabase } from '@/lib/supabaseData';

// Local project structure imports
import {
    CompetitionSelector,
    JuryInputs,
    PerformanceDataForm,
    TeamSelectSection,
    HeaderActions
} from './components';
import {
    COMPETITION_CATEGORIES,
    STATUS_OPTIONS,
    generateId,
    getPhasesForCategory,
    getCategoryMetadata
} from '@/lib/constants';
import { TeamScoreEntry } from '../types';

export default function ScoreCardPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [success, setSuccess] = useState(false);
    const [showCompList, setShowCompList] = useState(false);
    const router = useRouter();

    // Juries
    const [jury1, setJury1] = useState('');
    const [jury2, setJury2] = useState('');
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

    const isLineFollower = ['line_follower', 'junior_line_follower'].includes(competition.id);

    useEffect(() => {
        const loadInitialData = async () => {
            const [remoteTeams, remoteComps, remoteScores] = await Promise.all([
                fetchTeamsFromSupabase(),
                fetchCompetitionsFromSupabase(),
                fetchScoresFromSupabase()
            ]);
            setAllTeams(remoteTeams);
            setCompetitionsFromSupabase(remoteComps);
            setAllScores(remoteScores);
        };
        loadInitialData();

        if (!competition) return;

        // Sync Live State
        const syncState = () => {
            const state = getCompetitionState();
            const stateLiveSessions = state.liveSessions || {};
            const liveSess = stateLiveSessions[competition.id];
            const isCompLive = !!liveSess;

            setIsLive(isCompLive);

            if (isCompLive && liveSess.teamId) {
                setTeams(prev => {
                    if (prev[0] && prev[0].id === liveSess.teamId) return prev;
                    const copy = [...prev];
                    if (copy[0]) {
                        copy[0].id = liveSess.teamId;
                        return copy;
                    }
                    return prev;
                });
            }
        };

        syncState();
        window.addEventListener('competition-state-updated', syncState);
        window.addEventListener('storage', syncState);

        // Initial fetch from supabase
        fetchLiveSessionsFromSupabase().then(sessions => {
            if (Object.keys(sessions).length > 0) {
                // Pass false to avoid syncing back what we just fetched
                updateCompetitionState({ liveSessions: sessions }, false);
            }
        });

        return () => {
            window.removeEventListener('competition-state-updated', syncState);
            window.removeEventListener('storage', syncState);
        };
    }, [competition.id]);

    const handleRealtimeUpdate = async () => {
        const sessions = await fetchLiveSessionsFromSupabase();
        updateCompetitionState({ liveSessions: sessions }, false);
    };

    const handleTeamsUpdate = async () => {
        const remoteTeams = await fetchTeamsFromSupabase();
        setAllTeams(remoteTeams);
    };

    const handleScoresUpdate = useCallback(async () => {
        const scores = await fetchScoresFromSupabase();
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
        if (isLineFollower) return new Map();

        // 1. Identify all matches for this competition type + phase
        const relevantScores = allScores.filter(s => {
            const isMatchComp = s.competitionType === competition.id || competitionsFromSupabase.find((c: any) => c.id === s.competitionType)?.type === competition.id;
            return isMatchComp && s.phase === globalPhase && s.matchId;
        });

        // 2. Group by matchId and track latest timestamp and participant count
        const matchDataMap = new Map<string, { teamIds: string[], latestTimestamp: number }>();
        relevantScores.forEach(s => {
            if (!matchDataMap.has(s.matchId)) {
                matchDataMap.set(s.matchId, { teamIds: [], latestTimestamp: 0 });
            }
            const data = matchDataMap.get(s.matchId)!;
            data.teamIds.push(s.teamId);
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

            // Secondary: Activity (Ascending timestamp - OLDER matches first)
            if (dataA.latestTimestamp !== dataB.latestTimestamp) {
                return dataA.latestTimestamp - dataB.latestTimestamp;
            }

            // Tertiary: Deterministic Alphabetical ID
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
    }, [allScores, competition.id, globalPhase, isLineFollower, competitionsFromSupabase]);

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

    // Filter teams when competition or allTeams changes
    useEffect(() => {
        const groupData = availableGroupsMap.get(selectedGroup);

        const filtered = allTeams.filter(t => {
            if (!t.competition) return false;
            const comp = competitionsFromSupabase.find((c: any) => c.id === t.competition);
            const teamCategory = comp ? comp.type : t.competition;
            if (teamCategory !== competition.id) return false;

            // Apply group filter for non-line-follower
            if (!isLineFollower && groupData) {
                return groupData.teamIds.includes(t.id);
            }
            return true;
        });
        setCompetitionTeams(filtered);

        // For non-line-follower: Auto-add all teams from the group
        if (!isLineFollower && groupData && groupData.teamIds.length > 0) {
            const groupTeams = groupData.teamIds.map((tId: string) => ({ id: tId, status: 'qualified' }));
            setTeams(groupTeams as any);
            setNumberOfTeams(groupData.teamIds.length);
        }

        // For line-follower: Pre-fill first team if empty
        if (isLineFollower && filtered.length > 0 && teams[0] && !teams[0].id && !isLive) {
            const nextTeam = filtered[0];
            let targetPhase = teams[0].phase;

            const existingScores = getOfflineScores();
            const hasEssay1 = existingScores.some(s =>
                s.teamId === nextTeam.id &&
                s.competitionType === competition.id &&
                s.phase === 'Essay 1'
            );
            targetPhase = hasEssay1 ? 'Essay 2' : 'Essay 1';

            if (teams[0].id !== nextTeam.id || teams[0].phase !== targetPhase) {
                setCurrentTeamIndex(0);
                const newTeams = [...teams];
                newTeams[0] = { ...newTeams[0], id: nextTeam.id, phase: targetPhase };
                setTeams(newTeams);
            }
        }
    }, [competition, allTeams, isLive, isLineFollower, competitionsFromSupabase, selectedGroup, availableGroupsMap]);

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'jury') {
            router.push('/auth/jury');
            return;
        }
        setSession(currentSession);
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
                    try {
                        const storedCodes = localStorage.getItem('enstarobots_staff_codes');
                        if (storedCodes) {
                            const parsed: any[] = JSON.parse(storedCodes);
                            const juryNames = parsed
                                .filter(c => c.role === 'jury' && (c.competition === currentSession.competition || c.competition === compFromDb.type))
                                .map(c => c.name);
                            setAvailableJuries(juryNames);
                        }
                    } catch (e) {
                        console.error("Failed to load jury names", e);
                    }
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
        if (isLineFollower) {
            setTeams([{ id: '', phase: 'Essay 1' }]);
        } else {
            // Initializing with group logic will be handled by the other useEffect
            setGlobalPhase('Qualifications');
        }
    }, [competition, isLineFollower]);

    // Sync globalPhase changes to global state if live (for non-LF)
    useEffect(() => {
        if (isLive && !isLineFollower && teams[0]?.id) {
            const state = getCompetitionState();
            const liveSess = state.liveSessions[competition.id];

            // Only update if the phase is actually different to avoid loops
            if (liveSess && liveSess.phase !== globalPhase) {
                startLiveSession(teams[0].id, competition.id, globalPhase);
            }
        }
    }, [globalPhase, isLive, isLineFollower, competition.id, teams]);

    // Update number of teams for non-LF
    useEffect(() => {
        if (!isLineFollower) {
            if (numberOfTeams !== teams.length) {
                const newTeams = [...teams];
                if (numberOfTeams > newTeams.length) {
                    while (newTeams.length < numberOfTeams) {
                        newTeams.push({ id: '', status: 'qualified' });
                    }
                } else if (numberOfTeams < newTeams.length) {
                    newTeams.splice(numberOfTeams);
                }
                setTeams(newTeams);
            }
        }
    }, [numberOfTeams, isLineFollower, teams.length]); // Use teams.length as dependency instead of teams array reference

    const handleNextCard = () => {
        if (competitionTeams.length === 0) return;

        let nextIndex = currentTeamIndex + 1;
        if (nextIndex >= competitionTeams.length) {
            alert("End of team list reached.");
            return;
        }

        setCurrentTeamIndex(nextIndex);
        const nextTeam = competitionTeams[nextIndex];

        const newTeams = [...teams];
        newTeams[0].id = nextTeam.id;

        // Auto update phase if line follower
        if (isLineFollower) {
            const existingScores = getOfflineScores();
            const hasEssay1 = existingScores.some(s =>
                s.teamId === nextTeam.id &&
                s.competitionType === competition.id &&
                s.phase === 'Essay 1'
            );
            newTeams[0].phase = hasEssay1 ? 'Essay 2' : 'Essay 1';
        }

        setTeams(newTeams);

        if (isLive) {
            const phase = isLineFollower ? (newTeams[0].phase || 'Essay 1') : globalPhase;
            startLiveSession(newTeams[0].id, competition.id, phase);
        }
    };

    const handleStartMatch = () => {
        // Find current team ID being scored (first input team)
        const activeTeamId = teams[0].id;
        if (activeTeamId) {
            setIsLive(true);
            const phase = isLineFollower ? (teams[0].phase || 'Essay 1') : globalPhase;
            startLiveSession(activeTeamId, competition.id, phase);
        } else {
            alert("Please select a team or ensure teams are loaded.");
        }
    };

    const handleEndMatch = () => {
        // Mark the current phase as completed on the public board
        const currentPhaseVal = isLineFollower ? (teams[0].phase || 'Essay 1') : globalPhase;
        const phaseLabel = competitionPhases.find(p => p === currentPhaseVal) || currentPhaseVal;

        updateCompetitionStatusToSupabase(competition.id || competition.id, `${phaseLabel} Completed`);

        stopLiveSession(competition.id);
        setIsLive(false);
    };

    const handleTeamChange = (index: number, field: string, value: string) => {
        const newTeams = [...teams] as TeamScoreEntry[];
        newTeams[index] = { ...newTeams[index], [field]: value };

        // If it's a Line Follower and the ID changed, check for existing Essay 1
        if (isLineFollower && field === 'id' && value.trim() !== '') {
            const existingScores = getOfflineScores();
            const hasEssay1 = existingScores.some(s =>
                s.teamId === value &&
                s.competitionType === competition.id &&
                s.phase === 'Essay 1'
            );
            if (hasEssay1) {
                newTeams[index].phase = 'Essay 2';
            } else {
                newTeams[index].phase = 'Essay 1';
            }
        }

        setTeams(newTeams);

        // Immediate Live Sync if the first team (active team) changes
        if (isLive && index === 0 && (field === 'id' || field === 'phase')) {
            const activeId = field === 'id' ? value : newTeams[0].id;
            const phase = isLineFollower ? (field === 'phase' ? value : newTeams[0].phase) : globalPhase;
            if (activeId) {
                startLiveSession(activeId, competition.id, phase!);
            }
        }
    };


    // Check if a phase has already been submitted for a team
    const isPhaseSubmitted = useCallback((teamId: string, phase: string): boolean => {
        if (!teamId.trim()) return false;

        const normComp = competition.id.toLowerCase();
        const normPhase = phase.toLowerCase();

        // 1. Check Offline Storage
        const offlineScores = getOfflineScores();
        const hasOffline = offlineScores.some(s =>
            s.teamId === teamId &&
            s.competitionType.toLowerCase() === normComp &&
            s.phase?.toLowerCase() === normPhase
        );
        if (hasOffline) return true;

        // 2. Check Remote Synchronized Scores
        const hasRemote = allScores.some(s =>
            s.team_id === teamId &&
            (s.competition_id?.toLowerCase() === normComp) &&
            s.phase?.toLowerCase() === normPhase
        );

        return hasRemote;
    }, [competition.id, allScores]);

    // Check if ALL teams in the current group have submitted for the phase
    const isPhaseComplete = useMemo(() => {
        if (competitionTeams.length === 0) return false;
        return competitionTeams.every(t => isPhaseSubmitted(t.id, isLineFollower ? (teams[0]?.phase || 'Essay 1') : globalPhase));
    }, [competitionTeams, globalPhase, isLineFollower, teams, competition.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(false);

        // Check for duplicate phase submissions
        for (const team of teams) {
            const phaseToCheck = isLineFollower ? team.phase : globalPhase;
            if (isPhaseSubmitted(team.id, phaseToCheck!)) {
                alert(`Team ${team.id} has already submitted a score for ${phaseToCheck?.replace(/_/g, ' ')}. Please select a different phase or team.`);
                setSubmitting(false);
                return;
            }
        }

        const groupData = availableGroupsMap.get(selectedGroup);
        const matchId = groupData ? groupData.id : `match_${generateId()}`;
        const totalTimeMs = isLineFollower ?
            (parseInt(timeMinutes || '0') * 60000) + (parseInt(timeSeconds || '0') * 1000) + parseInt(timeMillis || '0')
            : undefined;

        const payloads = teams.map(team => {
            const bonuses = isLineFollower && homologationPoints ? parseInt(homologationPoints) : 0;
            const kos = !isLineFollower && knockouts ? parseInt(knockouts) : 0;
            const jpts = !isLineFollower && juryPoints ? parseInt(juryPoints) : 0;
            const dmg = !isLineFollower && damageScore ? parseInt(damageScore) : 0;

            const score = calculateTotalPoints(competition.id, {
                timeMs: totalTimeMs,
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
                phase: isLineFollower ? team.phase : globalPhase,
                juryId: session.userId,
                juryNames: [jury1, jury2],
                timeMs: totalTimeMs,
                completedRoad: isLineFollower ? completedRoad : undefined,
                bonusPoints: bonuses,
                knockouts: kos,
                juryPoints: jpts,
                damageScore: dmg,
                penalties: 0,
                timestamp: Date.now(),
                totalPoints: score,
                detailedScores: isLineFollower ? detailedScores : undefined,
                isSentToTeam: true,
                status: team.status
            };
        });

        let hasError = false;
        for (const payload of payloads) {
            const dbPayload = {
                match_id: payload.matchId,
                team_id: payload.teamId,
                competition_id: payload.competitionType, // Note: using competition_id as in supabaseData.ts
                phase: payload.phase,
                time_ms: payload.timeMs,
                penalties: 0,
                bonus_points: payload.bonusPoints,
                knockouts: payload.knockouts,
                judge_points: payload.juryPoints,
                damage_score: payload.damageScore,
                judge_id: payload.juryId,
                judge_names: payload.juryNames,
                completed_road: payload.completedRoad, // Adjusted to match library
                total_points: payload.totalPoints,
                detailed_scores: payload.detailedScores || null,
                is_sent_to_team: true,
                status: payload.status
            };

            if (isOnline) {
                try {
                    const { error } = await (supabase.from('scores') as any).insert(dbPayload);
                    if (error) {
                        hasError = true;
                        saveScoreOffline(payload);
                    }
                } catch (err) {
                    hasError = true;
                    saveScoreOffline(payload);
                }
            } else {
                saveScoreOffline(payload);
            }
        }

        if (!hasError) {
            setSuccess(true);
            handleEndMatch();

            // Reset scores but keep judges
            setTimeMinutes(''); setTimeSeconds(''); setTimeMillis('');
            setCompletedRoad(false); setHomologationPoints('');
            setKnockouts(''); setJuryPoints(''); setDamageScore('');
            setDetailedScores({});

            // Advance to next team
            const nextIndex = currentTeamIndex + 1;
            if (nextIndex < competitionTeams.length) {
                setCurrentTeamIndex(nextIndex);
                const nextTeam = competitionTeams[nextIndex];
                const newTeams = [...teams];
                newTeams[0].id = nextTeam.id;

                // Auto update phase if line follower
                if (isLineFollower) {
                    const existingScores = getOfflineScores();
                    const hasEssay1 = existingScores.some(s =>
                        s.teamId === nextTeam.id &&
                        s.competitionType === competition.id &&
                        s.phase === 'Essay 1'
                    );
                    newTeams[0].phase = hasEssay1 ? 'Essay 2' : 'Essay 1';
                }
                setTeams(newTeams);
            } else {
                setTeams(teams.map(t => ({ ...t, id: '', phase: isLineFollower ? 'Essay 1' : undefined })));
            }

            setTimeout(() => setSuccess(false), 3000);
        }
        setSubmitting(false);
    };

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
                    isLive={isLive}
                    handleNextCard={handleNextCard}
                    handleEndMatch={handleEndMatch}
                    handleStartMatch={handleStartMatch}
                    isLineFollower={isLineFollower}
                    teams={teams}
                    globalPhase={globalPhase}
                    competition={competition}
                    isPhaseComplete={isPhaseComplete}
                />

                {/* Competition Selector */}
                <CompetitionSelector
                    competition={competition}
                    setCompetition={setCompetition}
                    showCompList={showCompList}
                    setShowCompList={setShowCompList}
                    locked={!!session?.competition}
                />

                {/* Main Card */}
                <div className="bg-card border border-card-border rounded-2xl p-4 md:p-6 shadow-2xl relative min-h-[400px]">
                    {loading ? (
                        <div className="space-y-6 animate-pulse">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-10 bg-muted rounded-xl w-full" />
                                <div className="h-10 bg-muted rounded-xl w-full" />
                            </div>
                            <div className="h-24 bg-muted rounded-xl w-full" />
                            <div className="h-48 bg-muted rounded-xl w-full" />
                            <div className="h-14 bg-muted rounded-xl w-full" />
                        </div>
                    ) : (
                        <>
                            {!isLive && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                                    <div className="bg-card border border-card-border p-4 rounded-xl shadow-xl flex items-center gap-2 text-muted-foreground font-bold">
                                        <Info size={18} />
                                        <span>Press Start to unlock score card</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity duration-300 ${!isLive ? 'opacity-40 pointer-events-none' : ''}`}>

                                <JuryInputs
                                    jury1={jury1} setJury1={setJury1}
                                    jury2={jury2} setJury2={setJury2}
                                    availableJuries={availableJuries}
                                />

                                <div className="w-full h-px bg-card-border" />

                                <TeamSelectSection
                                    isLineFollower={isLineFollower}
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
                                />

                                <div className="w-full h-px bg-card-border" />

                                <PerformanceDataForm
                                    isLineFollower={isLineFollower}
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

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${submitting ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-accent text-slate-900 hover:bg-accent/90 shadow-accent/20'
                                        }`}
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : success ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Data Synchronized
                                        </>
                                    ) : (
                                        'Submit Score Card'
                                    )}
                                </button>
                            </form>
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
