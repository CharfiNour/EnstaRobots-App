"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Search, Filter, Trophy, Timer, Swords,
    Target, Layers, AlertCircle, ClipboardCheck, ArrowUpRight, Shield, Trash2, Radar
} from 'lucide-react';
import { getOfflineScores, clearAllOfflineScores } from '@/lib/offlineScores';
import { getTeams } from '@/lib/teams';
import ScoreCard from '@/components/jury/ScoreCard';
import { updateCompetitionState, getCompetitionState } from '@/lib/competitionState';
import { fetchScoresFromSupabase, pushScoreToSupabase, fetchCompetitionsFromSupabase, clearAllScoresFromSupabase, fetchTeamsFromSupabase, fetchLiveSessionsFromSupabase, clearCategoryMatchesFromSupabase, clearCategoryScoresFromSupabase } from '@/lib/supabaseData';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { COMPETITION_CATEGORIES as GLOBAL_CATEGORIES, getPhasesForCategory, getCategoryMetadata, LEGACY_ID_MAP, UUID_MAP } from '@/lib/constants';
import { dataCache, cacheKeys } from '@/lib/dataCache';
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

/**
 * HELPER: Robustly resolve any competition identifier to a canonical slug
 */
function canonicalizeCompId(id: string | any | undefined, dbComps: any[] = []): string {
    if (!id) return '';
    const norm = String(id).toLowerCase().trim();

    // 0. Pre-emptive check: Known Slugs
    const knownSlugs = ['junior_line_follower', 'junior_all_terrain', 'line_follower', 'all_terrain', 'fight'];
    if (knownSlugs.includes(norm)) return norm;

    // 1. UUID Map (Production Database IDs)
    if (UUID_MAP[norm]) return UUID_MAP[norm];

    // 2. Check Database records if available
    const db = (dbComps || []).find(c =>
        (c.id && String(c.id).toLowerCase() === norm) ||
        (c.type && String(c.type).toLowerCase() === norm)
    );
    if (db?.type) return db.type;

    // 2. Check local categories (Slugs)
    const local = GLOBAL_CATEGORIES.find(c =>
        (c.id && String(c.id).toLowerCase() === norm) ||
        (c.type && String(c.type).toLowerCase() === norm)
    );
    if (local) return local.type;

    // 3. LEGACY Map fallback
    for (const [slug, legacyId] of Object.entries(LEGACY_ID_MAP)) {
        if (String(legacyId).toLowerCase() === norm || String(slug).toLowerCase() === norm) return slug.toLowerCase();
    }

    return norm.toLowerCase();
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
    const phaseScrollRef = useRef<HTMLDivElement>(null);

    const [competitions, setCompetitions] = useState<any[]>([]);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [drawState, setDrawState] = useState<'idle' | 'counting' | 'success'>('idle');
    const [countdown, setCountdown] = useState<number>(3);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const lockedComp = useMemo(() => {
        if (!lockedCompetitionId) return null;
        const canonical = canonicalizeCompId(lockedCompetitionId, competitions);
        return competitions.find(c => c.id === canonical || c.type === canonical) ||
            COMPETITION_CATEGORIES.find(c => c.id === canonical || c.type === canonical);
    }, [competitions, lockedCompetitionId]);

    const selectedCompData = useMemo(() => {
        const canonical = canonicalizeCompId(selectedCompetition, competitions);
        return competitions.find(c => c.id === canonical || c.type === canonical) ||
            COMPETITION_CATEGORIES.find(c => c.id === canonical || c.type === canonical);
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
            const canonicalTComp = canonicalizeCompId(t.competition, competitions);
            const canonicalTarget = canonicalizeCompId(selectedCompetition, competitions);
            return canonicalTComp === canonicalTarget;
        });

        // Use a simpler map to avoid over-deduplication that might be hiding teams
        const uniqueTeams = Array.from(new Map(compTeams.map(t => [t.id, t])).values());

        return uniqueTeams.filter(t => !t.isPlaceholder);
    }, [selectedCompetition, competitions, allTeams, resolvedCompId, selectedCompData]);

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

    // Realtime Updates with Debouncing
    const scoreUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const liveUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleScoresUpdate = useCallback(() => {
        if (scoreUpdateTimeoutRef.current) clearTimeout(scoreUpdateTimeoutRef.current);

        scoreUpdateTimeoutRef.current = setTimeout(async () => {
            try {
                // Invalidate caches to ensure we get fresh data
                dataCache.invalidate(cacheKeys.scores());
                dataCache.invalidatePattern('teams');
                dataCache.invalidate(cacheKeys.competitions());

                // Use allSettled to be resilient to partial connection failures on mobile
                const results = await Promise.allSettled([
                    fetchScoresFromSupabase(),
                    fetchTeamsFromSupabase(),
                    fetchCompetitionsFromSupabase()
                ]);

                const scores = results[0].status === 'fulfilled' ? results[0].value : [];
                const teams = results[1].status === 'fulfilled' ? results[1].value : allTeams; // Fallback to current
                const comps = results[2].status === 'fulfilled' ? results[2].value : competitions;

                // Parity with Init: merge local metadata
                const allComps = [...(comps || [])];
                GLOBAL_CATEGORIES.forEach(localCat => {
                    if (!allComps.find(c => c.type === localCat.id || c.id === localCat.id)) {
                        allComps.push({ id: localCat.id, type: localCat.id, name: localCat.name });
                    }
                });

                const order = COMPETITION_CATEGORIES.map(c => c.id);
                const sortedComps = allComps.sort((a: any, b: any) => order.indexOf(a.type) - order.indexOf(b.type));

                setCompetitions(sortedComps);
                setAllTeams(teams);
                processScores(scores, teams, sortedComps);
            } catch (e) {
                console.error("Realtime sync failed", e);
            } finally {
                setLoading(false);
            }
        }, 500); // 500ms debounce
    }, [allTeams, competitions]); // Dependencies might need check, but refs are stable. 
    // Ideally use empty deps for debounce wrapper, but valid for fetch

    useSupabaseRealtime('scores', handleScoresUpdate);
    useSupabaseRealtime('teams', handleScoresUpdate);
    useSupabaseRealtime('competitions', handleScoresUpdate);

    const handleLiveUpdate = useCallback(() => {
        if (liveUpdateTimeoutRef.current) clearTimeout(liveUpdateTimeoutRef.current);

        liveUpdateTimeoutRef.current = setTimeout(async () => {
            // Invalidate cache
            dataCache.invalidate(cacheKeys.liveSessions());

            const sessions = await fetchLiveSessionsFromSupabase();
            updateCompetitionState({ liveSessions: sessions });
        }, 500);
    }, []);

    useSupabaseRealtime('live_sessions', handleLiveUpdate);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Fetch remote data with individual error handling
                const results = await Promise.allSettled([
                    fetchScoresFromSupabase(),
                    fetchTeamsFromSupabase(),
                    fetchCompetitionsFromSupabase()
                ]);

                const scores = results[0].status === 'fulfilled' ? results[0].value : [];
                const teams = results[1].status === 'fulfilled' ? results[1].value : [];
                const comps = results[2].status === 'fulfilled' ? (results[2].value || []) : [];

                if (results[1].status === 'rejected') console.warn("Teams load failed", results[1].reason);
                if (results[2].status === 'rejected') console.warn("Comps load failed", results[2].reason);

                // MERGE: Ensure we have local metadata for all categories even if DB fetch is partial
                const allComps = [...comps];
                GLOBAL_CATEGORIES.forEach(localCat => {
                    if (!allComps.find(c => c.type === localCat.id || c.id === localCat.id)) {
                        allComps.push({ id: localCat.id, type: localCat.id, name: localCat.name });
                    }
                });

                const order = COMPETITION_CATEGORIES.map(c => c.id);
                const sortedComps = allComps.sort((a: any, b: any) => order.indexOf(a.type) - order.indexOf(b.type));

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

        const allTeams = teamsList;

        // Strict filter: Ignore scores for teams that were filtered out as "dead data"
        let allProcessedScores = Array.from(scoreMap.values()).filter(score => {
            const team = allTeams.find((t: any) => String(t.id) === String(score.teamId) || String(t.code) === String(score.teamId));
            return !!team;
        });

        // Helper to check if a comp is match based
        const checkIsMatchBased = (compId: string) => {
            const id = (compId || '').toLowerCase();
            if (['fight', 'all_terrain', 'junior_all_terrain', '5', '4', '2'].includes(id)) return true;
            const comp = compsList.find((c: any) => c.id === compId || c.type === compId || c.id === id || c.type === id);
            const category = (comp?.category || comp?.type || '').toLowerCase();
            return ['fight', 'all_terrain', 'junior_all_terrain'].includes(category);
        };

        const groups: Record<string, any> = {};

        // 1. Process existing scores
        allProcessedScores.forEach(score => {
            const team = allTeams.find((t: any) => String(t.id) === String(score.teamId) || String(t.code) === String(score.teamId));

            // Resolve canonical competition slug for this score
            const teamComp = team?.competition;
            const scoreComp = score.competitionType;
            const canonicalComp = canonicalizeCompId(teamComp || scoreComp, compsList);
            console.log(`ProcessScores: Score ${score.id} (Team ${score.teamId}) -> TeamComp: '${teamComp}', ScoreComp: '${scoreComp}', Canonical: '${canonicalComp}'`);


            const isMatch = checkIsMatchBased(canonicalComp);

            if (isMatch && score.matchId) {
                // Group by matchId
                const key = score.matchId;
                if (!groups[key]) {
                    groups[key] = {
                        type: 'match',
                        matchId: key,
                        competitionType: canonicalComp,
                        participants: [],
                        latestTimestamp: 0
                    };
                    console.log(`ProcessScores: Created new match group for key '${key}' (Comp: '${canonicalComp}')`);
                }

                let participant = groups[key].participants.find((p: any) => p.teamId === score.teamId);
                if (!participant) {
                    participant = {
                        teamId: score.teamId,
                        team,
                        submissions: []
                    };
                    groups[key].participants.push(participant);
                    console.log(`ProcessScores: Added participant ${score.teamId} to match group '${key}'`);
                }
                participant.submissions.push(score);
                if (score.timestamp > groups[key].latestTimestamp) {
                    groups[key].latestTimestamp = score.timestamp;
                }
            } else {
                // Single team grouping
                const groupKey = `single-${score.teamId}-${canonicalComp}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        type: 'single',
                        teamId: score.teamId,
                        team,
                        competitionType: canonicalComp,
                        submissions: [],
                        latestTimestamp: 0
                    };
                    console.log(`ProcessScores: Created new single group for key '${groupKey}' (Comp: '${canonicalComp}')`);
                }
                groups[groupKey].submissions.push(score);
                if (score.timestamp > groups[groupKey].latestTimestamp) {
                    groups[groupKey].latestTimestamp = score.timestamp;
                }
            }
        });

        // 2. Inject teams with no scores to ensure they appear in the Unit Registry
        allTeams.forEach((team: any) => {
            if (!team.competition) return;

            const canonicalComp = canonicalizeCompId(team.competition, compsList);
            console.log(`ProcessScores: Injecting team ${team.id} (Comp: '${team.competition}') -> Canonical: '${canonicalComp}'`);

            const exists = Object.values(groups).some((g: any) => {
                const gComp = g.competitionType;
                const compMatches = gComp === canonicalComp;
                if (!compMatches) return false;

                if (g.type === 'single') return String(g.teamId) === String(team.id);
                return g.participants?.some((p: any) => String(p.teamId) === String(team.id));
            });

            if (!exists) {
                const key = `injected-${team.id}-${canonicalComp}`;
                groups[key] = {
                    type: 'single',
                    teamId: team.id,
                    team,
                    competitionType: canonicalComp,
                    submissions: [],
                    latestTimestamp: 0
                };
                console.log(`ProcessScores: Injected team ${team.id} into new single group '${key}' (Comp: '${canonicalComp}')`);
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
        // Use canonical ID for the target competition
        const canonicalTarget = canonicalizeCompId(lockedCompetitionId || selectedCompetition || initialCompetition, competitions);
        console.log(`FilteredGroups: Canonical target competition: '${canonicalTarget}'`);

        const filtered = groupedScores.filter(g => {
            // Use canonical ID for the group's competition type
            const canonicalGComp = canonicalizeCompId(g.competitionType, competitions);
            const matchesComp = canonicalGComp === canonicalTarget;
            console.log(`FilteredGroups: Group '${g.matchId || g.teamId}' (Comp: '${g.competitionType}' -> Canonical: '${canonicalGComp}') matches target '${canonicalTarget}': ${matchesComp}`);

            // Phase filtering:
            // 1. ALWAYS show individual teams in the sidebar registry so they can be selected/scored
            // 2. ONLY show match groups if they belong to the selected phase (or are the match draw)
            const matchesPhase =
                selectedPhaseFilter === 'all' ||
                selectedPhaseFilter === '' ||
                g.type === 'single' || // Registry: Always show single units in sidebar
                (g.type === 'match' && (g.participants?.every((p: any) => !(p.submissions || []).some((s: any) => (s.phase || '').toLowerCase() === (selectedPhaseFilter || '').toLowerCase())) || false)) || // Draw: Show groups if no results in this phase yet
                (g.type === 'match' && (g.participants || []).some((p: any) => (p.submissions || []).some((s: any) => (s.phase || '').toLowerCase() === (selectedPhaseFilter || '').toLowerCase())));

            // Team ID filtering (Strict for team role)
            const matchesTeamId = !teamId || (
                g.type === 'single'
                    ? String(g.teamId) === String(teamId)
                    : g.participants.some((p: any) => String(p.teamId) === String(teamId))
            );

            if (!matchesComp || !matchesPhase || !matchesTeamId) return false;

            if (g.type === 'match') {
                // Search in participants
                const matchesSearch = (g.participants || []).some((p: any) =>
                    (p.teamId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.team?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.team?.club || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
                return matchesSearch;
            } else {
                const matchesSearch = (g.teamId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (g.competitionType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (g.team?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSearch;
            }
        });

        // NEW: If match-based and ANY match group exists, remove 'single' entries for this specific competition
        const hasMatchGroups = filtered.some(g => g.type === 'match');
        if (hasMatchGroups) {
            // ALWAYS prioritize match groups over individual teams in the "Matches" tab
            const matchesOnly = filtered.filter(g => g.type === 'match');
            if (matchesOnly.length > 0) return matchesOnly;
        }

        return filtered;
    }, [groupedScores, searchQuery, selectedCompType, selectedPhaseFilter, resolvedCompId, selectedCompetition, teamId, competitions]);

    // Synchronize selection when competition changes
    useEffect(() => {
        // Only run if filtered groups actually changed or we have no selection
        const first = filteredGroups[0];
        if (!first) return;

        // Reset specific selection states to avoid mismatching data
        setSelectedGroup((prev: any) => {
            // Guard against resetting if already correctly selected
            const prevId = prev?.matchId || prev?.teamId;
            const newId = first?.matchId || first?.teamId;
            if (prevId === newId && prev?.type === first?.type) return prev;

            // If we are changing, update child states
            if (first.type === 'single') {
                setActivePhase(first.submissions[0]?.phase || '');
                setSelectedTeamInGroup(null);
            } else if (first.participants?.length > 0) {
                setSelectedTeamInGroup(first.participants[0].teamId);
                setActivePhase(first.participants[0].submissions[0]?.phase || '');
            }
            return first;
        });
    }, [selectedCompetition, filteredGroups.length]);

    // Live Phase & Selection Synchronization for Visitors/Jury
    useEffect(() => {
        if (!mounted || isAdmin) return;

        const currentPhaseInDB = selectedCompData?.current_phase;
        if (currentPhaseInDB && selectedPhaseFilter !== currentPhaseInDB) {
            setSelectedPhaseFilter(currentPhaseInDB);
        }

        // Auto-select Live session for visitors
        const liveSess = liveSessions[resolvedCompId];
        if (liveSess) {
            const liveGroup = groupedScores.find(g =>
                (g.type === 'match' && g.participants?.some((p: any) => p.teamId === liveSess.teamId)) ||
                (g.type === 'single' && g.teamId === liveSess.teamId)
            );

            if (liveGroup) {
                // IMPORTANT: Use deep identity checks for groups
                const selectedGroupId = selectedGroup?.matchId || selectedGroup?.teamId;
                const liveGroupId = liveGroup.matchId || liveGroup.teamId;

                if (selectedGroupId !== liveGroupId || selectedGroup?.type !== liveGroup.type) {
                    setSelectedGroup(liveGroup);
                }

                if (liveSess.phase && activePhase !== liveSess.phase) {
                    setActivePhase(liveSess.phase);
                }

                if (liveGroup.type === 'match' && selectedTeamInGroup !== liveSess.teamId) {
                    setSelectedTeamInGroup(liveSess.teamId);
                }
            }
        }
    }, [selectedCompData?.current_phase, isAdmin, liveSessions, resolvedCompId, mounted, groupedScores, selectedGroup?.matchId, selectedGroup?.teamId, activePhase, selectedTeamInGroup]);

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

            // Only reset if the filter is empty OR actually invalid
            // Don't reset if it's already a valid phase (prevents resetting when clicking cards)
            if (selectedPhaseFilter === '' || isInvalid) {
                setSelectedPhaseFilter(allCompetitionPhases[0]);
            }
        }
    }, [allCompetitionPhases.length, selectedCompType, selectedPhaseFilter]); // Use length and type to avoid array size warnings

    // Check which phases are accessible (all previous phases must be completed)
    const phaseAccessibility = useMemo(() => {
        if (!isMatchBasedComp) return {}; // Line follower doesn't have phase restrictions

        const accessibility: Record<string, boolean> = {};

        for (let i = 0; i < allCompetitionPhases.length; i++) {
            const currentPhase = allCompetitionPhases[i];

            if (i === 0) {
                // First phase is always accessible
                accessibility[currentPhase] = true;
            } else {
                // Check if previous phase is completed
                const prevPhase = allCompetitionPhases[i - 1];
                const canonicalTarget = canonicalizeCompId(selectedCompetition, competitions);

                const prevPhaseScores = groupedScores.filter(g => {
                    const canonicalGComp = canonicalizeCompId(g.competitionType, competitions);
                    if (canonicalGComp !== canonicalTarget) return false;

                    if (g.type === 'match') {
                        return g.participants?.some((p: any) =>
                            p.submissions?.some((s: any) => s.phase === prevPhase)
                        );
                    }
                    return g.submissions?.some((s: any) => s.phase === prevPhase);
                });

                // Previous phase is completed if:
                // 1. There are scores for it AND
                // 2. All scores have status !== 'pending'
                const isPrevPhaseCompleted = prevPhaseScores.length > 0 && prevPhaseScores.every(g => {
                    if (g.type === 'match') {
                        return g.participants?.every((p: any) =>
                            p.submissions?.filter((s: any) => s.phase === prevPhase)
                                .every((s: any) => s.status !== 'pending')
                        );
                    }
                    return g.submissions?.filter((s: any) => s.phase === prevPhase)
                        .every((s: any) => s.status !== 'pending');
                });

                accessibility[currentPhase] = isPrevPhaseCompleted;
            }
        }

        return accessibility;
    }, [allCompetitionPhases, groupedScores, selectedCompetition, competitions, isMatchBasedComp]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentScore = currentScoreGroup?.submissions?.find((s: any) => s.phase === activePhase) || currentScoreGroup?.submissions?.[0] || null;
    // lockedComp is already defined at the top via useMemo

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
            const currentPhase = selectedPhaseFilter;

            // Calculate eligible teams based on phase
            let eligibleTeams = [];
            const phaseIdx = allCompetitionPhases.indexOf(currentPhase);
            const prevPhase = phaseIdx > 0 ? allCompetitionPhases[phaseIdx - 1] : null;

            if (!prevPhase) {
                // First phase: all registered teams
                eligibleTeams = [...trulyUniqueTeams];
            } else {
                // Subsequent phases: winners/qualified from previous phase
                const canonicalTarget = canonicalizeCompId(selectedCompetition, competitions);
                const winners = groupedScores.filter(g => {
                    const canonicalGComp = canonicalizeCompId(g.competitionType, competitions);
                    if (canonicalGComp !== canonicalTarget) return false;

                    if (g.type === 'match') {
                        return g.participants?.some((p: any) =>
                            p.submissions?.some((s: any) =>
                                s.phase === prevPhase && (s.status === 'winner' || s.status === 'qualified')
                            )
                        );
                    }
                    return g.submissions?.some((s: any) =>
                        s.phase === prevPhase && (s.status === 'winner' || s.status === 'qualified')
                    );
                }).flatMap(g => {
                    if (g.type === 'match') {
                        return g.participants
                            ?.filter((p: any) =>
                                p.submissions?.some((s: any) =>
                                    s.phase === prevPhase && (s.status === 'winner' || s.status === 'qualified')
                                )
                            )
                            .map((p: any) => p.team) || [];
                    }
                    return [g.team];
                });

                eligibleTeams = winners.filter(Boolean);
            }

            if (eligibleTeams.length < 2) {
                alert(`Insufficient teams for ${currentPhase} (Found ${eligibleTeams.length}). Need at least 2 teams to perform a draw.`);
                setIsDrawLoading(false);
                return;
            }

            // INTELLIGENT MATCHING: Club-aware interleaving
            // 1. Group by club
            const clubMap: Record<string, any[]> = {};
            eligibleTeams.forEach(t => {
                const c = t.club && t.club.trim() !== '' ? t.club : `unique-${t.id}`;
                if (!clubMap[c]) clubMap[c] = [];
                clubMap[c].push(t);
            });

            // 2. Shuffle each club's teams
            Object.values(clubMap).forEach(teams => {
                teams.sort(() => Math.random() - 0.5);
            });

            // 3. Interleave to separate club members
            const interleaved: any[] = [];
            const clubNames = Object.keys(clubMap).sort(() => Math.random() - 0.5);
            let maxCount = Math.max(...Object.values(clubMap).map(ts => ts.length));

            for (let i = 0; i < maxCount; i++) {
                clubNames.forEach(c => {
                    if (clubMap[c][i]) interleaved.push(clubMap[c][i]);
                });
            }

            // 4. Create match groups
            const K = drawTeamsCount;
            const N = interleaved.length;
            const numGroups = Math.ceil(N / K);
            let chunks: any[][] = [];
            let currentIndex = 0;

            for (let i = 0; i < numGroups; i++) {
                const groupSize = Math.ceil((N - currentIndex) / (numGroups - i));
                chunks.push(interleaved.slice(currentIndex, currentIndex + groupSize));
                currentIndex += groupSize;
            }

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
                            // 0. CLEAR only pending matches for THIS PHASE of this competition
                            const variants = new Set<string>();
                            if (competitionId) variants.add(competitionId);
                            const slug = (selectedCompData?.type || selectedCompData?.category || selectedCompetition).toLowerCase();
                            if (slug) variants.add(slug);

                            const legacyMap: Record<string, string> = {
                                'junior_line_follower': '1',
                                'junior_all_terrain': '2',
                                'line_follower': '3',
                                'all_terrain': '4',
                                'fight': '5'
                            };
                            if (legacyMap[slug]) variants.add(legacyMap[slug]);

                            console.log(`Clearing pending matches for ${currentPhase} in:`, Array.from(variants));

                            // Clear only this phase's pending matches
                            const currentScores = await fetchScoresFromSupabase();
                            const scoresToKeep = currentScores.filter((s: any) => {
                                const matchesThisComp = Array.from(variants).some(v =>
                                    s.competitionType === v || canonicalizeCompId(s.competitionType, competitions) === v
                                );
                                // Keep if: different comp, different phase, or not pending
                                return !(matchesThisComp && s.phase === currentPhase && s.status === 'pending');
                            });

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
                                        phase: currentPhase,
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

                            // 1. Instantly update the local UI
                            console.log("Applying optimistic update to UI...");
                            const combinedScores = [...scoresToKeep, ...newScores];
                            processScores(combinedScores, allTeams, competitions);

                            // AUTO-SWITCH PHASE: Ensure the user sees the new draw immediately
                            if (newScores.length > 0) {
                                setSelectedPhaseFilter(currentPhase);
                            }

                            // 2. Perform DB sync in background
                            console.log(`Syncing ${pushPromises.length} entries to Supabase...`);
                            await Promise.all(pushPromises);

                            // 3. Final sync to refresh everything from DB
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
            <div className={`w-full lg:w-80 flex-col shrink-0 ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} h-[calc(100vh-230px)] lg:h-[650px]`}>
                <div className="bg-white/50 backdrop-blur-xl border border-card-border rounded-[2rem] p-4 lg:p-5 shadow-xl shadow-black/5 space-y-4 flex flex-col h-full overflow-y-auto overflow-x-clip">
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
                        <div className="shrink-0">
                            {lockedCompetitionId && lockedComp ? (
                                <div className="mb-6">
                                    <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 px-1 flex items-center gap-2">
                                        <Radar size={12} className="text-role-primary animate-spin-slow" />
                                        Deployment Category
                                    </h2>
                                    <div className="w-full bg-role-primary/5 border border-role-primary/20 p-4 rounded-xl flex items-center justify-between group shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-role-primary/10 blur-2xl rounded-full -mr-12 -mt-12 opacity-50"></div>
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(var(--role-primary-rgb),0.5)] ${(() => {
                                                const type = selectedCompData?.type || selectedCompetition;
                                                if (type.includes('junior_line')) return 'bg-cyan-500';
                                                if (type.includes('junior_all')) return 'bg-emerald-500';
                                                if (type.includes('line_follower')) return 'bg-indigo-500';
                                                if (type.includes('all_terrain')) return 'bg-orange-500';
                                                if (type.includes('fight')) return 'bg-rose-500';
                                                return 'bg-role-primary';
                                            })()}`} />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase tracking-wider text-foreground leading-none mb-1">
                                                    {lockedComp.name}
                                                </span>
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-role-primary opacity-60">
                                                    {selectedCompData?.current_phase || "Verified Operations Sector"}
                                                </span>
                                            </div>
                                        </div>
                                        <Shield size={16} className="text-role-primary opacity-40 shrink-0" />
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 px-1 flex items-center gap-2">
                                        <Radar size={12} className="text-role-primary animate-spin-slow" />
                                        Deployment Category
                                    </h2>
                                    <div className="relative group/custom-select">
                                        <button
                                            onClick={() => setIsCompMenuOpen(!isCompMenuOpen)}
                                            className="w-full bg-white/60 backdrop-blur-xl border border-card-border pl-4 pr-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none flex items-center justify-between transition-all hover:bg-white/80 shadow-md group-hover/custom-select:shadow-accent/10"
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
                                </div>
                            )}

                            {/* Competition Phase Selector - Now showing regardless of lock */}
                            <div className="mb-6">
                                <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mt-2 mb-3 px-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers size={12} className="text-role-primary" />
                                        Competition Phase
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                if (phaseScrollRef.current) {
                                                    phaseScrollRef.current.scrollBy({ left: -120, behavior: 'smooth' });
                                                }
                                            }}
                                            className="w-6 h-6 rounded-full bg-white/80 border border-card-border flex items-center justify-center hover:bg-role-primary/10 hover:border-role-primary/30 transition-all shadow-sm"
                                        >
                                            <ChevronLeft size={12} className="text-muted-foreground" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (phaseScrollRef.current) {
                                                    phaseScrollRef.current.scrollBy({ left: 120, behavior: 'smooth' });
                                                }
                                            }}
                                            className="w-6 h-6 rounded-full bg-white/80 border border-card-border flex items-center justify-center hover:bg-role-primary/10 hover:border-role-primary/30 transition-all shadow-sm"
                                        >
                                            <ChevronRight size={12} className="text-muted-foreground" />
                                        </button>
                                    </div>
                                </h2>
                                <div
                                    ref={phaseScrollRef}
                                    className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 snap-x"
                                >
                                    {allCompetitionPhases.map((phase: string) => {
                                        const isSelected = selectedPhaseFilter === phase;
                                        const isAccessible = phaseAccessibility[phase] !== false; // Default to true for non-match-based

                                        return (
                                            <button
                                                key={phase}
                                                onClick={() => isAccessible && setSelectedPhaseFilter(phase)}
                                                disabled={!isAccessible}
                                                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 snap-start whitespace-nowrap shadow-md ${!isAccessible
                                                    ? 'bg-muted/30 text-muted-foreground/40 border-card-border/50 cursor-not-allowed opacity-50'
                                                    : isSelected
                                                        ? 'bg-gradient-to-r from-role-primary to-role-primary/80 text-white border-transparent shadow-role-primary/25 scale-105'
                                                        : 'bg-white text-muted-foreground border-card-border hover:bg-white/80 hover:text-foreground hover:border-role-primary/20'
                                                    }`}
                                            >
                                                {(phase || '').replace('qualifications', 'Qual').replace('final', 'Final').replace(/_/g, ' ')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
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
                                                className={`rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm ${groupSelected
                                                    ? 'border-role-primary/50 bg-role-primary/5'
                                                    : 'border-card-border bg-white/50 hover:border-accent/20'
                                                    }`}
                                            >
                                                {/* Match Header */}
                                                <div className="px-4 py-2.5 bg-accent/5 border-b border-card-border flex justify-between items-center backdrop-blur-sm">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-accent transition-colors">
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
                                                                className={`w-full p-3 rounded-xl text-left transition-all border group relative overflow-hidden ${isTeamSelected
                                                                    ? 'bg-role-primary/20 border-role-primary/30 shadow-inner'
                                                                    : 'bg-transparent border-transparent hover:bg-black/5'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0 relative z-10">
                                                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-[9px] md:text-[10px] shrink-0 border transition-colors ${isTeamSelected
                                                                        ? 'bg-role-primary text-white border-role-primary shadow-lg shadow-role-primary/20'
                                                                        : 'bg-muted text-muted-foreground border-card-border'
                                                                        }`}>
                                                                        {participant.team?.logo ? <img src={participant.team.logo} className="w-full h-full object-cover rounded-lg" alt="" /> : (participant.teamId || "?").charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`text-[11px] md:text-sm font-black uppercase truncate transition-colors ${isTeamSelected ? 'text-role-primary' : 'text-foreground'}`}>
                                                                            {participant.team?.name || participant.teamId}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">

                                                                            {mounted && liveSessions[resolvedCompId]?.teamId === participant.teamId && (
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                                                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
                                                                                </div>
                                                                            )}
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
                                            className={`w-full p-4 rounded-2xl text-left transition-all border group relative overflow-hidden shadow-sm ${isSelected
                                                ? 'bg-role-primary/5 border-role-primary/20'
                                                : 'bg-white/60 border-card-border hover:bg-white/80 hover:border-accent/20'}`}
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
            <div className={`flex-1 bg-white/40 backdrop-blur-xl border border-card-border rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 lg:p-10 shadow-2xl relative lg:h-[650px] flex flex-col items-center overflow-y-auto lg:overflow-hidden ${mobileView === 'detail' ? 'flex' : 'hidden lg:flex'}`}>
                {/* Mobile Back Button */}
                <div className="lg:hidden w-full mb-4">
                    <button
                        onClick={() => setMobileView('list')}
                        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 backdrop-blur-md border border-card-border text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all shadow-sm mb-2 group active:scale-95"
                    >
                        <ChevronLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Unit Registry
                    </button>
                </div >

                <AnimatePresence mode="wait">
                    {(isAdmin || isJury) && isMatchBasedComp && (() => {
                        // Check if current phase has been drawn
                        const phaseIdx = allCompetitionPhases.indexOf(selectedPhaseFilter);
                        const prevPhase = phaseIdx > 0 ? allCompetitionPhases[phaseIdx - 1] : null;

                        // Check if previous phase is finished (all scores are not 'pending')
                        const isPrevPhaseFinished = !prevPhase || groupedScores.filter(g => {
                            const canonicalGComp = canonicalizeCompId(g.competitionType, competitions);
                            const canonicalTarget = canonicalizeCompId(selectedCompetition, competitions);
                            if (canonicalGComp !== canonicalTarget) return false;

                            if (g.type === 'match') {
                                return g.participants?.some((p: any) =>
                                    p.submissions?.some((s: any) => s.phase === prevPhase)
                                );
                            }
                            return g.submissions?.some((s: any) => s.phase === prevPhase);
                        }).every(g => {
                            if (g.type === 'match') {
                                return g.participants?.every((p: any) =>
                                    p.submissions?.filter((s: any) => s.phase === prevPhase)
                                        .every((s: any) => s.status !== 'pending')
                                );
                            }
                            return g.submissions?.filter((s: any) => s.phase === prevPhase)
                                .every((s: any) => s.status !== 'pending');
                        });

                        // Check if current phase has matches drawn
                        const isPhaseDrawn = groupedScores.some(g => {
                            const canonicalGComp = canonicalizeCompId(g.competitionType, competitions);
                            const canonicalTarget = canonicalizeCompId(selectedCompetition, competitions);
                            if (canonicalGComp !== canonicalTarget) return false;

                            if (g.type === 'match') {
                                return g.participants?.some((p: any) =>
                                    p.submissions?.some((s: any) => s.phase === selectedPhaseFilter)
                                );
                            }
                            return false;
                        });

                        return !isPrevPhaseFinished || (!isPhaseDrawn || drawState !== 'idle');
                    })() ? (
                        !(() => {
                            const phaseIdx = allCompetitionPhases.indexOf(selectedPhaseFilter);
                            const prevPhase = phaseIdx > 0 ? allCompetitionPhases[phaseIdx - 1] : null;
                            const isPrevPhaseFinished = !prevPhase || groupedScores.filter(g => {
                                const canonicalGComp = canonicalizeCompId(g.competitionType, competitions);
                                const canonicalTarget = canonicalizeCompId(selectedCompetition, competitions);
                                return canonicalGComp === canonicalTarget;
                            }).every(g => {
                                if (g.type === 'match') {
                                    return g.participants?.every((p: any) =>
                                        p.submissions?.filter((s: any) => s.phase === prevPhase)
                                            .every((s: any) => s.status !== 'pending')
                                    );
                                }
                                return g.submissions?.filter((s: any) => s.phase === prevPhase)
                                    .every((s: any) => s.status !== 'pending');
                            });
                            return isPrevPhaseFinished;
                        })() ? (
                            <motion.div
                                key="phase-locked"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center justify-center py-20 text-center space-y-6"
                            >
                                <div className="p-6 bg-rose-500/10 rounded-full text-rose-500 relative">
                                    <AlertCircle size={60} />
                                    <div className="absolute inset-0 bg-rose-500/20 blur-[40px] rounded-full" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
                                        {selectedPhaseFilter} Has Not Started Yet
                                    </h2>
                                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2 opacity-60">
                                        Awaiting completion of previous tactical phase: {allCompetitionPhases[allCompetitionPhases.indexOf(selectedPhaseFilter) - 1]}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <DrawInterface
                                drawState={drawState}
                                countdown={countdown}
                                drawTeamsCount={drawTeamsCount}
                                setDrawTeamsCount={setDrawTeamsCount}
                                handleAutoDraw={handleAutoDraw}
                                drawPlan={drawPlan}
                                selectedPhase={selectedPhaseFilter}
                            />
                        )
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
            </div >
        </div >
    );
}

