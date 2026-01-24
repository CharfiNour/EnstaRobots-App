"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Search, Filter, Trophy, Timer, Swords,
    Target, Layers, AlertCircle, ClipboardCheck, ArrowUpRight, Shield, Trash2
} from 'lucide-react';
import { getOfflineScores, clearAllOfflineScores } from '@/lib/offlineScores';
import { getTeams } from '@/lib/teams';
import ScoreCard from '@/components/jury/ScoreCard';
import { updateCompetitionState, getCompetitionState } from '@/lib/competitionState';
import { fetchScoresFromSupabase, pushScoreToSupabase, fetchCompetitionsFromSupabase, clearAllScoresFromSupabase, fetchTeamsFromSupabase, fetchLiveSessionsFromSupabase, clearCategoryMatchesFromSupabase, clearCategoryScoresFromSupabase } from '@/lib/supabaseData';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { COMPETITION_CATEGORIES as GLOBAL_CATEGORIES, getPhasesForCategory, getCategoryMetadata, LEGACY_ID_MAP } from '@/lib/constants';
import DrawInterface from './DrawInterface';

const COMPETITION_CATEGORIES = GLOBAL_CATEGORIES;

interface ScoreHistoryViewProps {
    isSentToTeamOnly?: boolean;
    isAdmin?: boolean;
    initialCompetition?: string;
    showFilter?: boolean;
    lockedCompetitionId?: string;
    teamId?: string;
    isJury?: boolean;
}

export default function ScoreHistoryView({
    isSentToTeamOnly = false,
    isAdmin = false,
    initialCompetition = GLOBAL_CATEGORIES[0].id,
    showFilter = true,
    lockedCompetitionId,
    teamId,
    isJury = false
}: ScoreHistoryViewProps) {
    const [loading, setLoading] = useState(true);
    const [isDrawLoading, setIsDrawLoading] = useState(false);
    const [groupedScores, setGroupedScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [selectedTeamInGroup, setSelectedTeamInGroup] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompetition, setSelectedCompetition] = useState(lockedCompetitionId || initialCompetition);
    const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('');
    const [liveSessions, setLiveSessions] = useState<Record<string, any>>({});
    const [drawTeamsCount, setDrawTeamsCount] = useState(2);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    const [isCompMenuOpen, setIsCompMenuOpen] = useState(false);

    const [competitions, setCompetitions] = useState<any[]>([]);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [drawState, setDrawState] = useState<'idle' | 'counting' | 'success'>('idle');
    const [countdown, setCountdown] = useState<number>(3);

    // Resolve slug and type from UUID or slug
    const selectedCompData = useMemo(() => {
        return competitions.find(c => c.id === selectedCompetition || c.type === selectedCompetition);
    }, [competitions, selectedCompetition]);

    const resolvedCompId = selectedCompData?.id || selectedCompetition;
    const selectedCompType = (selectedCompData?.type || selectedCompData?.category || selectedCompetition || '').toLowerCase();

    const isMatchBasedComp = useMemo(() => {
        const matchBasedTypes = ['fight', 'all_terrain', 'junior_all_terrain'];
        return matchBasedTypes.some(t => selectedCompType.includes(t));
    }, [selectedCompType]);

    // Simplified phase calculation using centralized logic
    const allCompetitionPhases = useMemo(() => {
        return getPhasesForCategory(selectedCompType);
    }, [selectedCompType]);

    // 1. Identify and deduplicate teams for the selected competition
    const trulyUniqueTeams = useMemo(() => {
        const competitionId = resolvedCompId;
        const competitionType = (selectedCompData?.category || selectedCompData?.type || selectedCompetition).toLowerCase();

        const compTeams = allTeams.filter(t => {
            const teamComp = (t.competition || '').toLowerCase();
            return teamComp === selectedCompetition.toLowerCase() ||
                teamComp === competitionId.toLowerCase() ||
                teamComp === competitionType;
        });

        // Deduplicate teams by ID AND Robot Name to ensure accurate bracket generation
        const uniqueCompTeams = Array.from(
            new Map(
                compTeams
                    .filter(t => !t.isPlaceholder)
                    .map(t => [`${t.id}-${(t.robotName || t.name).toLowerCase().trim()}`, t])
            ).values()
        );

        // Final secondary pass to ensure robots with the same name don't get two spots if ID varies
        return Array.from(
            new Map(uniqueCompTeams.map(t => [(t.robotName || t.name).toLowerCase().trim(), t])).values()
        );
    }, [selectedCompetition, resolvedCompId, selectedCompData, allTeams]);

    // 2. Calculate match plan preview
    const drawPlan = useMemo(() => {
        if (!trulyUniqueTeams.length || !isMatchBasedComp) return null;
        const K = drawTeamsCount;
        const N = trulyUniqueTeams.length;
        const numGroups = Math.ceil(N / K);
        let sizes: number[] = [];
        let currentIndex = 0;
        for (let i = 0; i < numGroups; i++) {
            const groupSize = Math.ceil((N - currentIndex) / (numGroups - i));
            sizes.push(groupSize);
            currentIndex += groupSize;
        }
        return { total: N, sizes, groups: numGroups };
    }, [trulyUniqueTeams, drawTeamsCount, isMatchBasedComp]);

    // Sync state when props change (navigation)
    useEffect(() => {
        setSelectedCompetition(lockedCompetitionId || initialCompetition);
    }, [initialCompetition, lockedCompetitionId]);

    useEffect(() => {
        const sync = () => {
            const state = getCompetitionState();
            setLiveSessions(state.liveSessions || {});
        };
        sync();
        window.addEventListener('competition-state-updated', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('competition-state-updated', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);



    // Realtime Updates
    const handleScoresUpdate = async () => {
        try {
            const [scores, teams, comps] = await Promise.all([
                fetchScoresFromSupabase(),
                fetchTeamsFromSupabase(),
                fetchCompetitionsFromSupabase()
            ]);
            const order = COMPETITION_CATEGORIES.map(c => c.id);
            const sortedComps = (comps || []).sort((a: any, b: any) => order.indexOf(a.type) - order.indexOf(b.type));

            setCompetitions(sortedComps);
            setAllTeams(teams);
            processScores(scores, teams, sortedComps);
        } catch (e) {
            console.error("Realtime sync failed", e);
        } finally {
            setLoading(false);
        }
    };

    useSupabaseRealtime('scores', handleScoresUpdate);
    useSupabaseRealtime('teams', handleScoresUpdate);
    useSupabaseRealtime('competitions', handleScoresUpdate);

    const handleLiveUpdate = async () => {
        const sessions = await fetchLiveSessionsFromSupabase();
        updateCompetitionState({ liveSessions: sessions });
    };

    useSupabaseRealtime('live_sessions', handleLiveUpdate);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [comps, teams, scores] = await Promise.all([
                    fetchCompetitionsFromSupabase(),
                    fetchTeamsFromSupabase(),
                    fetchScoresFromSupabase()
                ]);

                const order = COMPETITION_CATEGORIES.map(c => c.id);
                const sortedComps = (comps || []).sort((a: any, b: any) => order.indexOf(a.type) - order.indexOf(b.type));

                setCompetitions(sortedComps);
                setAllTeams(teams);
                processScores(scores, teams, sortedComps);
            } catch (e) {
                console.error("Failed to fetch initial data", e);
                // Fallback to local
                processScores(getOfflineScores(), getTeams(), []);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Replaces loadScores but keeps the processing logic
    const processScores = (scoresList: any[], teamsList: any[], compsList: any[], forceSelectId?: string) => {
        // Merge offline scores with local ones to ensure immediate visibility
        const localScores = getOfflineScores();

        // Use a map to deduplicate by ID, prioritizing remote scores
        const scoreMap = new Map();
        localScores.forEach(s => scoreMap.set(s.id, { ...s, synced: false }));
        scoresList.forEach(s => scoreMap.set(s.id, { ...s, synced: true }));

        let allProcessedScores = Array.from(scoreMap.values());

        if (isSentToTeamOnly) {
            // Keep scores sent to team OR pending matches (the draw structure)
            allProcessedScores = allProcessedScores.filter(s => s.isSentToTeam || (s.matchId && s.status === 'pending'));
        }

        const allTeams = teamsList;

        // Helper to check if a comp is match based (using provided data)
        const checkIsMatchBased = (compId: string) => {
            if (['fight', 'all_terrain', 'junior_all_terrain'].includes(compId)) return true;
            const comp = compsList.find((c: any) => c.id === compId || c.type === compId);
            const category = comp?.category || comp?.type;
            return category && ['fight', 'all_terrain', 'junior_all_terrain'].includes(category);
        };

        const groups: Record<string, any> = {};

        // 1. Process existing scores
        allProcessedScores.forEach(score => {
            const team = allTeams.find((t: any) => t.id === score.teamId || t.code === score.teamId);

            // USE TEAM'S CURRENT COMPETITION if they have one, otherwise fallback to score competition
            const effectiveCompId = team?.competition || score.competitionType;
            const comp = compsList.find((c: any) => c.id === effectiveCompId || c.type === effectiveCompId);
            const normalizedCompType = comp?.type || effectiveCompId;

            const isMatch = checkIsMatchBased(normalizedCompType);

            if (isMatch && score.matchId) {
                // Group by matchId
                const key = score.matchId;
                if (!groups[key]) {
                    groups[key] = {
                        type: 'match',
                        matchId: key,
                        competitionType: normalizedCompType,
                        participants: [],
                        latestTimestamp: 0
                    };
                }

                let participant = groups[key].participants.find((p: any) => p.teamId === score.teamId);
                if (!participant) {
                    participant = {
                        teamId: score.teamId,
                        team,
                        submissions: []
                    };
                    groups[key].participants.push(participant);
                }
                participant.submissions.push(score);
                if (score.timestamp > groups[key].latestTimestamp) {
                    groups[key].latestTimestamp = score.timestamp;
                }
            } else {
                // Single team grouping
                const groupKey = `single-${score.teamId}-${normalizedCompType}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        type: 'single',
                        teamId: score.teamId,
                        team,
                        competitionType: normalizedCompType,
                        submissions: [],
                        latestTimestamp: 0
                    };
                }
                groups[groupKey].submissions.push(score);
                if (score.timestamp > groups[groupKey].latestTimestamp) {
                    groups[groupKey].latestTimestamp = score.timestamp;
                }
            }
        });

        // 2. Inject teams with no scores
        allTeams.forEach((team: any) => {
            if (!team.competition) return;

            const teamCompObj = compsList.find((c: any) => c.id === team.competition || c.type === team.competition);
            const teamCompSlug = teamCompObj?.type || team.competition;
            const teamCompUUID = teamCompObj?.id || team.competition;

            const exists = Object.values(groups).some((g: any) => {
                const gComp = g.competitionType;
                const compMatches = gComp === teamCompSlug || gComp === teamCompUUID;
                if (!compMatches) return false;

                if (g.type === 'single') return g.teamId === team.id;
                return g.participants.some((p: any) => p.teamId === team.id);
            });

            if (!exists) {
                const key = `injected-${team.id}-${teamCompSlug}`;
                groups[key] = {
                    type: 'single',
                    teamId: team.id,
                    team,
                    competitionType: teamCompSlug,
                    submissions: [],
                    latestTimestamp: 0
                };
            }
        });

        // 3. Sort groups: Full groups first, then by activity (timestamp), then alphabetical
        const sortedGroups = Object.values(groups).sort((a: any, b: any) => {
            // If they are match groups, prioritize the ones with MORE participants (the full ones)
            if (a.type === 'match' && b.type === 'match') {
                const sizeA = a.participants?.length || 0;
                const sizeB = b.participants?.length || 0;
                if (sizeA !== sizeB) return sizeB - sizeA; // Descending order: 4, 4, 3
            }

            if (a.latestTimestamp !== b.latestTimestamp) {
                return a.latestTimestamp - b.latestTimestamp;
            }

            const nameA = a.team?.name || a.matchId || "";
            const nameB = b.team?.name || b.matchId || "";
            return nameA.localeCompare(nameB);
        });

        setGroupedScores(sortedGroups);

        // 4. Handle initial/forced selection
        let toSelect = null;
        if (forceSelectId) {
            toSelect = sortedGroups.find(g => g.teamId === forceSelectId || g.matchId === forceSelectId);
        }

        // If nothing forced or not found, keep current or pick first
        if (!toSelect && sortedGroups.length > 0) {
            toSelect = sortedGroups[0];
        }

        if (toSelect) {
            setSelectedGroup(toSelect);
            if (toSelect.type === 'single') {
                setActivePhase(toSelect.submissions[0]?.phase || '');
                setSelectedTeamInGroup(null);
            } else if (toSelect.participants?.length > 0) {
                setSelectedTeamInGroup(toSelect.participants[0].teamId);
                setActivePhase(toSelect.participants[0].submissions[0]?.phase || '');
            }
        }

        setLoading(false);
    };

    const loadScores = (forceSelectId?: string) => {
        processScores(getOfflineScores(), getTeams(), competitions, forceSelectId);
    };

    const filteredGroups = useMemo(() => {
        const targetType = selectedCompType.toLowerCase();
        const targetId = resolvedCompId.toLowerCase();

        const filtered = groupedScores.filter(g => {
            // Match slug OR UUID
            const gComp = (g.competitionType || '').toLowerCase();
            const matchesComp = gComp === targetType || gComp === targetId;

            // Phase filtering: 
            const matchesPhase = selectedPhaseFilter === 'all' ||
                (g.type === 'single' && (g.submissions?.length || 0) === 0) ||
                (g.type === 'match' && (g.participants?.every((p: any) => p.submissions?.length === 0) || false)) ||
                (g.type === 'single'
                    ? g.submissions.some((s: any) => (s.phase || '').toLowerCase() === (selectedPhaseFilter || '').toLowerCase())
                    : g.participants.some((p: any) => p.submissions.some((s: any) => (s.phase || '').toLowerCase() === (selectedPhaseFilter || '').toLowerCase()))
                );

            // Team ID filtering (Strict for team role)
            const matchesTeamId = !teamId || (
                g.type === 'single'
                    ? String(g.teamId) === String(teamId)
                    : g.participants.some((p: any) => String(p.teamId) === String(teamId))
            );

            if (!matchesComp || !matchesPhase || !matchesTeamId) return false;

            if (g.type === 'match') {
                // Search in participants
                const matchesSearch = g.participants.some((p: any) =>
                    p.teamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.team?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.team?.club || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
                return matchesSearch;
            } else {
                const matchesSearch = g.teamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (g.competitionType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (g.team?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSearch;
            }
        });

        // NEW: If match-based and ANY match group exists, remove 'single' entries for this specific competition
        const hasMatchGroups = filtered.some(g => g.type === 'match');
        if (hasMatchGroups) {
            return filtered.filter(g => g.type === 'match');
        }

        return filtered;
    }, [groupedScores, searchQuery, selectedCompType, selectedPhaseFilter, resolvedCompId]);

    // Synchronize selection when competition changes
    useEffect(() => {
        // Reset specific selection states to avoid mismatching data
        setSelectedGroup(null);
        setSelectedTeamInGroup(null);
        setActivePhase('');
        setSelectedPhaseFilter(''); // Will be auto-picked by the other useEffect

        if (filteredGroups.length > 0) {
            const first = filteredGroups[0];
            setSelectedGroup(first);
            if (first.type === 'single') {
                setActivePhase(first.submissions[0]?.phase || '');
                setSelectedTeamInGroup(null);
            } else if (first.participants?.length > 0) {
                setSelectedTeamInGroup(first.participants[0].teamId);
                setActivePhase(first.participants[0].submissions[0]?.phase || '');
            }
        }
    }, [selectedCompetition]);

    // Secondary sync for phase filter and internal selection
    useEffect(() => {
        if (!selectedGroup && filteredGroups.length > 0) {
            const first = filteredGroups[0];
            setSelectedGroup(first);
            if (first.type === 'single') {
                setActivePhase(first.submissions[0]?.phase || '');
            } else if (first.participants?.length > 0) {
                setSelectedTeamInGroup(first.participants[0].teamId);
                setActivePhase(first.participants[0].submissions[0]?.phase || '');
            }
        }
    }, [filteredGroups, selectedPhaseFilter]);

    // Get current score data for display
    const currentScoreGroup = useMemo(() => {
        if (!selectedGroup) return null;

        // Validate that current selection actually exists in filtered results
        // This prevents showing stale data when switching competitions
        const isValid = filteredGroups.some(g =>
            (g.type === 'single' && g.teamId === selectedGroup.teamId) ||
            (g.type === 'match' && g.matchId === selectedGroup.matchId)
        );

        const activeGroup = isValid ? selectedGroup : (filteredGroups.length > 0 ? filteredGroups[0] : null);

        if (!activeGroup) return null;

        if (activeGroup.type === 'single') {
            return activeGroup;
        } else if (activeGroup.type === 'match') {
            const targetTeamId = isValid ? selectedTeamInGroup : (activeGroup.participants[0]?.teamId);
            const participant = activeGroup.participants.find((p: any) => p.teamId === targetTeamId);

            if (participant) {
                return {
                    type: 'match',
                    teamId: participant.teamId,
                    team: participant.team,
                    competitionType: activeGroup.competitionType,
                    submissions: participant.submissions,
                    latestTimestamp: activeGroup.latestTimestamp
                };
            }
        }
        return null;
    }, [selectedGroup, selectedTeamInGroup, filteredGroups]);

    // Get available phases for selected group/team - must be before any returns
    const availablePhases = useMemo(() => {
        if (!currentScoreGroup?.submissions) return [];
        const phases = currentScoreGroup.submissions.map((s: any) => s.phase);
        return [...new Set(phases)] as string[];
    }, [currentScoreGroup]);


    // Draw Logic: Should we show the "Start the Draw" initializer?
    const hasAnyScoresForCompetition = useMemo(() => {
        if (!selectedCompType) return true;

        const targetId = resolvedCompId.toLowerCase();
        const targetType = selectedCompType.toLowerCase();

        const compGroups = groupedScores.filter(g => {
            const gComp = (g.competitionType || '').toLowerCase();
            return gComp === targetType || gComp === targetId;
        });

        if (isMatchBasedComp) {
            // For match-based, the "list is set" only if we have match groups
            return compGroups.some(g => g.type === 'match');
        } else {
            // For single, it's set if anyone has a score (or just teams exist)
            return compGroups.some(g => g.submissions && g.submissions.length > 0);
        }
    }, [groupedScores, selectedCompType, isMatchBasedComp, resolvedCompId]);

    // Auto-select first phase when competition type changes or if current filter is invalid
    useEffect(() => {
        if (allCompetitionPhases.length > 0) {
            const isInvalid = selectedPhaseFilter !== 'all' && selectedPhaseFilter !== '' && !allCompetitionPhases.includes(selectedPhaseFilter);

            if (selectedPhaseFilter === '' || isInvalid) {
                setSelectedPhaseFilter(allCompetitionPhases[0]);
            }
        }
    }, [allCompetitionPhases, selectedCompType]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentScore = currentScoreGroup?.submissions?.find((s: any) => s.phase === activePhase) || currentScoreGroup?.submissions?.[0] || null;
    const lockedComp = lockedCompetitionId ? COMPETITION_CATEGORIES.find(c => c.id === lockedCompetitionId) : null;

    const handleSelectTeam = (group: any, teamId?: string) => {
        setDrawState('idle'); // Clear any draw success message
        setSelectedGroup(group);
        if (group.type === 'single') {
            const targetPhase = selectedPhaseFilter !== 'all' && group.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                ? selectedPhaseFilter
                : (group.submissions[0]?.phase || '');
            setActivePhase(targetPhase);
            setSelectedTeamInGroup(null);
        } else if (group.type === 'match' && teamId) {
            setSelectedTeamInGroup(teamId);
            const participant = group.participants.find((p: any) => p.teamId === teamId);
            if (participant?.submissions?.length > 0) {
                const targetPhase = selectedPhaseFilter !== 'all' && participant.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                    ? selectedPhaseFilter
                    : (participant.submissions[0]?.phase || '');
                setActivePhase(targetPhase);
            } else {
                setActivePhase('');
            }
        }
        setMobileView('detail');
    };

    // Check if a specific group/team is selected
    const isGroupSelected = (group: any) => {
        if (!selectedGroup) return false;
        if (group.type === 'single' && selectedGroup.type === 'single') {
            return group.teamId === selectedGroup.teamId && group.competitionType === selectedGroup.competitionType;
        }
        if (group.type === 'match' && selectedGroup.type === 'match') {
            return group.matchId === selectedGroup.matchId;
        }
        return false;
    };

    const isTeamInGroupSelected = (group: any, teamId: string) => {
        return isGroupSelected(group) && selectedTeamInGroup === teamId;
    };



    const handleAutoDraw = async () => {
        if (!selectedCompetition || !isMatchBasedComp) return;
        setIsDrawLoading(true);

        const generateId = () => {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
            return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        };

        try {
            const competitionId = resolvedCompId;

            if (trulyUniqueTeams.length < 2) {
                alert(`Insufficient unique teams found (Found ${trulyUniqueTeams.length}). Need at least 2 teams to perform a draw.`);
                setIsDrawLoading(false);
                return;
            }

            // Shuffle
            const shuffled = [...trulyUniqueTeams];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            const K = drawTeamsCount;
            const N = shuffled.length;
            const numGroups = Math.ceil(N / K);
            let chunks: any[][] = [];
            let currentIndex = 0;

            for (let i = 0; i < numGroups; i++) {
                const groupSize = Math.ceil((N - currentIndex) / (numGroups - i));
                chunks.push(shuffled.slice(currentIndex, currentIndex + groupSize));
                currentIndex += groupSize;
            }

            const numMatches = chunks.length;

            // 3. Skip confirmation and start countdown
            setDrawState('counting');
            let count = 3;
            setCountdown(count);

            const timer = setInterval(async () => {
                count--;
                if (count > 0) {
                    setCountdown(count);
                } else {
                    clearInterval(timer);
                    setDrawState('success');

                    // Wait 1.5s to show "matches are set" then process
                    setTimeout(async () => {
                        try {
                            // 0. COMPREHENSIVE CLEAR: Identify all possible ID variants for this competition
                            const variants = new Set<string>();
                            if (competitionId) variants.add(competitionId);
                            const slug = (selectedCompData?.type || selectedCompData?.category || selectedCompetition).toLowerCase();
                            if (slug) variants.add(slug);

                            // Map legacy numeric IDs if they exist in the display map
                            const legacyMap: Record<string, string> = {
                                'junior_line_follower': '1',
                                'junior_all_terrain': '2',
                                'line_follower': '3',
                                'all_terrain': '4',
                                'fight': '5'
                            };
                            if (legacyMap[slug]) variants.add(legacyMap[slug]);

                            console.log("Clearing all pending matches for variants:", Array.from(variants));

                            await Promise.all(
                                Array.from(variants).map(v => clearCategoryMatchesFromSupabase(v))
                            );

                            // 1. RE-USE CALCULATED CHUNKS
                            // Using the chunks calculated at the start of handleAutoDraw to ensure
                            // the preview match plan perfectly matches the applied result.

                            // 2. CREATE DATABASE ENTRIES
                            const newScores: any[] = [];
                            const pushPromises: Promise<any>[] = [];

                            chunks.forEach(chunk => {
                                const matchId = generateId();
                                chunk.forEach(team => {
                                    const scoreObj = {
                                        id: generateId(),
                                        matchId: matchId,
                                        teamId: team.id,
                                        competitionType: competitionId,
                                        phase: 'Qualifications',
                                        timestamp: Date.now(),
                                        totalPoints: 0,
                                        synced: true,
                                        isSentToTeam: true,
                                        status: 'pending'
                                    };
                                    newScores.push(scoreObj);
                                    pushPromises.push(pushScoreToSupabase(scoreObj as any));
                                });
                            });

                            // 1. Instantly update the local UI using current scores + new ones
                            // We merge newScores with existing scores from fetchScoresFromSupabase (mocked or real)
                            // to ensure old scores don't disappear during the update.
                            console.log("Applying optimistic update to UI...");
                            const currentScores = await fetchScoresFromSupabase();
                            const combinedScores = [...currentScores.filter((s: any) => {
                                // Filter out old pending matches for this competition type to avoid duplicates
                                const matchesThisComp = s.competitionType === competitionId || s.competitionType === slug;
                                return !(matchesThisComp && s.status === 'pending');
                            }), ...newScores];

                            processScores(combinedScores, allTeams, competitions);

                            // AUTO-SWITCH PHASE: Ensure the user sees the new draw immediately
                            if (newScores.length > 0) {
                                setSelectedPhaseFilter('Qualifications');
                            }

                            // 2. Perform DB sync in background
                            console.log(`Syncing ${pushPromises.length} entries to Supabase...`);
                            await Promise.all(pushPromises);

                            // 3. Final sync to refresh everything from DB and ensure total consistency
                            await handleScoresUpdate();

                        } catch (e: any) {
                            console.error("Draw failed:", e);
                            alert("Digital draw failed. Please check your network connection.");
                            setDrawState('idle');
                        } finally {
                            setIsDrawLoading(false);
                        }
                    }, 1500);
                }
            }, 1000);

        } catch (e: any) {
            console.error("Draw failed:", e);
            alert("Digital draw failed. Please check your network connection.");
            setIsDrawLoading(false);
        }
    };

    const handleClearAll = async () => {
        const targetTitle = (selectedCompData?.name || selectedCompetition);

        const confirmMsg = `DANGER: This will delete ALL score records and matches for ${targetTitle}. Proceed?`;

        if (confirm(confirmMsg)) {
            setLoading(true);
            try {
                // Context-aware Clear (Multi-variant logic)
                const compSlug = (selectedCompData?.type || selectedCompData?.category || selectedCompetition).toLowerCase();
                const variants = new Set([resolvedCompId.toLowerCase(), compSlug]);
                if (LEGACY_ID_MAP[compSlug]) variants.add(LEGACY_ID_MAP[compSlug]);

                console.log("Clearing registry for variants:", Array.from(variants));

                await Promise.all(
                    Array.from(variants).map(v => clearCategoryScoresFromSupabase(v))
                );

                // Combined Functionality: Also clear local browser buffer
                clearAllOfflineScores();

                await handleScoresUpdate();
                alert("Records and local buffer cleared successfully.");
            } catch (e) {
                console.error("Clear failed:", e);
                alert("Failed to clear records. Please check your connection.");
            } finally {
                setLoading(false);
            }
        }
    };

    // Calculate match group indices for display ("GROUP 1", "GROUP 2"...)
    const matchGroups = filteredGroups.filter(g => g.type === 'match');

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Sidebar: Tactical Log List */}
            <div className={`w-full lg:w-80 flex-col shrink-0 h-[600px] lg:h-[650px] ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-full overflow-hidden">
                    {/* Admin Maintenance Actions */}
                    {isAdmin && (
                        <div className="flex flex-col gap-2 mb-2">
                            <button
                                onClick={handleClearAll}
                                className="w-full px-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Trash2 size={14} />
                                <span>Factory Reset Category</span>
                            </button>
                        </div>
                    )}

                    {/* Competition Selector */}
                    {showFilter && (
                        <div>
                            {lockedCompetitionId && lockedComp ? (
                                <div className="mb-4 w-full p-4 rounded-xl border flex flex-col items-center justify-center gap-2 bg-muted/30 border-card-border shadow-inner">
                                    <Shield className="w-6 h-6 text-role-primary" />
                                    <span className="text-sm font-black uppercase tracking-widest text-role-primary text-center leading-tight">
                                        {lockedComp.name}
                                    </span>
                                    <div className="px-2 py-0.5 rounded text-[8px] uppercase font-black bg-role-primary/10 text-role-primary border border-role-primary/20">
                                        Official Sector
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 px-1 flex items-center gap-2">
                                        <Target size={12} className="text-role-primary" />
                                        Deployment Category
                                    </h2>
                                    <div className="relative group/custom-select">
                                        <button
                                            onClick={() => setIsCompMenuOpen(!isCompMenuOpen)}
                                            className="w-full bg-muted/50 border border-card-border pl-4 pr-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider outline-none flex items-center justify-between transition-all hover:bg-muted/70 hover:border-role-primary/30"
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <div className={`w-2 h-2 rounded-full ${(() => {
                                                    const type = selectedCompData?.type || selectedCompetition;
                                                    if (type.includes('junior_line')) return 'bg-cyan-500';
                                                    if (type.includes('junior_all')) return 'bg-emerald-500';
                                                    if (type.includes('line_follower')) return 'bg-indigo-500';
                                                    if (type.includes('all_terrain')) return 'bg-orange-500';
                                                    if (type.includes('fight')) return 'bg-rose-500';
                                                    return 'bg-role-primary';
                                                })()}`} />
                                                <span className="truncate">{selectedCompData?.name || selectedCompetition}</span>
                                            </div>
                                            <ChevronRight size={14} className={`transition-transform duration-300 ${isCompMenuOpen ? 'rotate-[-90deg]' : 'rotate-90'}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isCompMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    className="absolute top-full left-0 right-0 mt-2 z-[100] bg-card border border-card-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden backdrop-blur-xl"
                                                >
                                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5">
                                                        {competitions.map((cat) => {
                                                            const isSelected = selectedCompetition === cat.id;
                                                            const isLive = !!liveSessions[cat.id];

                                                            return (
                                                                <button
                                                                    key={cat.id}
                                                                    onClick={() => {
                                                                        setSelectedCompetition(cat.id);
                                                                        setIsCompMenuOpen(false);
                                                                    }}
                                                                    className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between group ${isSelected ? 'bg-role-primary/10 text-role-primary' : 'hover:bg-muted/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className={`w-2 h-2 rounded-full shrink-0 ${(() => {
                                                                            if (cat.type.includes('junior_line')) return 'bg-cyan-500';
                                                                            if (cat.type.includes('junior_all')) return 'bg-emerald-500';
                                                                            if (cat.type.includes('line_follower')) return 'bg-indigo-500';
                                                                            if (cat.type.includes('all_terrain')) return 'bg-orange-500';
                                                                            if (cat.type.includes('fight')) return 'bg-rose-500';
                                                                            return 'bg-role-primary';
                                                                        })()}`} />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest truncate">
                                                                            {cat.name}
                                                                        </span>
                                                                    </div>

                                                                    {isLive && (
                                                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                                                                            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                                                            <span className="text-[8px] font-black text-red-500 uppercase">Live</span>
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mt-6 mb-3 px-1 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layers size={12} className="text-role-primary" />
                                            {selectedCompetition.includes('line_follower') ? 'Session Phase' : 'Strategic Phase'}
                                        </div>
                                    </h2>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 snap-x">
                                        {allCompetitionPhases.map((phase: string) => (
                                            <button
                                                key={phase}
                                                onClick={() => setSelectedPhaseFilter(phase)}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 snap-start whitespace-nowrap ${selectedPhaseFilter === phase
                                                    ? 'bg-role-primary text-white border-role-primary shadow-lg shadow-role-primary/20 scale-105'
                                                    : 'bg-card/50 text-muted-foreground border-card-border/50 hover:bg-muted/50 hover:text-foreground'
                                                    }`}
                                            >
                                                {(phase || '').replace('qualifications', 'Qual').replace('final', 'Final').replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Search and Teams List */}
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 px-1 flex items-center gap-2 shrink-0">
                            <Shield size={12} className="text-role-primary" />
                            Active Units
                        </h2>

                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredGroups.length === 0 ? (
                                <div className="py-10 text-center opacity-40">
                                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase">No Units Found</p>
                                </div>
                            ) : (
                                filteredGroups.map((group) => {
                                    // MATCH GROUP RENDERING
                                    if (group.type === 'match') {
                                        const groupSelected = isGroupSelected(group);
                                        const groupIndex = matchGroups.findIndex(mg => mg.matchId === group.matchId) + 1;

                                        return (
                                            <div
                                                key={group.matchId}
                                                className={`rounded-xl border overflow-hidden transition-all ${groupSelected
                                                    ? 'border-role-primary/30 bg-role-primary/5'
                                                    : 'border-card-border bg-card'
                                                    }`}
                                            >
                                                {/* Match Header */}
                                                <div className="px-3 py-2 bg-muted/30 border-b border-card-border/50 flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        GROUP {groupIndex}
                                                    </span>
                                                    <span className="text-[8px] font-mono text-muted-foreground/60">
                                                        {new Date(group.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Participants */}
                                                <div className="p-1.5 space-y-1">
                                                    {group.participants.map((participant: any) => {
                                                        const isTeamSelected = isTeamInGroupSelected(group, participant.teamId);

                                                        return (
                                                            <button
                                                                key={`${group.matchId}-${participant.teamId}`}
                                                                onClick={() => handleSelectTeam(group, participant.teamId)}
                                                                className={`w-full p-3 rounded-lg text-left transition-all border group relative overflow-hidden ${isTeamSelected
                                                                    ? 'bg-role-primary/10 border-role-primary/30 shadow-sm'
                                                                    : 'bg-card border-card-border/50 hover:bg-muted/50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0 relative z-10">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] shrink-0 border transition-colors ${isTeamSelected
                                                                        ? 'bg-role-primary text-white border-role-primary shadow-lg shadow-role-primary/20'
                                                                        : 'bg-muted text-muted-foreground border-card-border'
                                                                        }`}>
                                                                        {participant.team?.logo ? (
                                                                            <img src={participant.team.logo} className="w-full h-full object-cover rounded-lg" alt="" />
                                                                        ) : (
                                                                            participant.teamId.slice(-2).toUpperCase()
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className={`font-black text-[11px] truncate uppercase ${isTeamSelected ? 'text-role-primary' : 'text-foreground'
                                                                            }`}>
                                                                            {participant.team?.name || participant.teamId}
                                                                        </div>
                                                                        <div className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest truncate">
                                                                            {participant.team?.club || 'Club Unknown'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {isTeamSelected && (
                                                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-role-primary" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // SINGLE TEAM RENDERING (Line Follower style)
                                    const isSelected = isGroupSelected(group);

                                    return (
                                        <button
                                            key={`${group.teamId}-${group.competitionType}`}
                                            onClick={() => handleSelectTeam(group)}
                                            className={`w-full p-4 rounded-xl text-left transition-all border group relative overflow-hidden ${isSelected
                                                ? 'bg-role-primary/10 border-role-primary/30 shadow-sm'
                                                : 'bg-card border-card-border hover:bg-muted/50'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 relative z-10">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border transition-colors ${isSelected ? 'bg-role-primary text-white border-role-primary shadow-lg shadow-role-primary/20' : 'bg-muted text-muted-foreground border-card-border'}`}>
                                                    {group.team?.logo ? (
                                                        <img src={group.team.logo} className="w-full h-full object-cover rounded-lg" alt="" />
                                                    ) : (
                                                        group.teamId.slice(-2).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className={`font-black text-[12px] truncate uppercase ${isSelected ? 'text-role-primary' : 'text-foreground'}`}>
                                                        {group.team?.name || group.teamId}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest truncate">
                                                            {group.team?.club || 'Club Unknown'}
                                                        </div>
                                                        <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                                        <div className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 truncate">
                                                            {group.team?.university || 'University Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-role-primary" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative lg:h-[650px] flex flex-col items-center justify-center ${mobileView === 'detail' ? 'flex' : 'hidden lg:flex'}`}>
                {/* Mobile Back Button */}
                <div className="lg:hidden w-full mb-6">
                    <button
                        onClick={() => setMobileView('list')}
                        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Back to Unit List
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {((isAdmin || isJury || !!lockedCompetitionId) && isMatchBasedComp && (!hasAnyScoresForCompetition || drawState !== 'idle')) ? (
                        <DrawInterface
                            drawState={drawState}
                            countdown={countdown}
                            drawTeamsCount={drawTeamsCount}
                            setDrawTeamsCount={setDrawTeamsCount}
                            handleAutoDraw={handleAutoDraw}
                            drawPlan={drawPlan}
                        />
                    ) : currentScoreGroup ? (
                        <motion.div
                            key={`${currentScoreGroup.teamId}-${currentScoreGroup.competitionType}-${activePhase}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                        >
                            <ScoreCard
                                group={currentScoreGroup}
                                activePhase={activePhase}
                                onPhaseChange={setActivePhase}
                                isAdmin={isAdmin}
                                onDelete={() => handleScoresUpdate()}
                                matchParticipants={selectedGroup?.type === 'match' ? selectedGroup.participants : undefined}
                                allCompetitions={competitions}
                            />
                        </motion.div>
                    ) : (
                        <div className="text-center opacity-30 space-y-4">
                            <Target size={48} className="mx-auto text-muted-foreground" />
                            <div>
                                <p className="font-black uppercase tracking-widest text-sm mb-1 italic">Unit Selection Required</p>
                                <p className="text-[10px] font-bold uppercase tracking-tight max-w-[240px] mx-auto">Select a tactical performance entry from the registry to view detailed specifications.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

