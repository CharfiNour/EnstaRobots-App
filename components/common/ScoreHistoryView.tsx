"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Search, Filter, Trophy, Timer, Swords,
    Target, Layers, AlertCircle, ClipboardCheck, ArrowUpRight, Shield
} from 'lucide-react';
import { getOfflineScores, clearAllOfflineScores } from '@/lib/offlineScores';
import { getTeams } from '@/lib/teams';
import ScoreCard from '@/components/jury/ScoreCard';
import { getCompetitionState } from '@/lib/competitionState';
import { fetchScoresFromSupabase, pushScoreToSupabase, fetchCompetitionsFromSupabase, clearAllScoresFromSupabase } from '@/lib/supabaseData';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

const COMPETITION_CATEGORIES = [
    { id: 'all', name: 'All Categories' },
    { id: 'junior_line_follower', name: 'Junior Line Follower' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain' },
    { id: 'line_follower', name: 'Line Follower' },
    { id: 'all_terrain', name: 'All Terrain' },
    { id: 'fight', name: 'Fight' },
];

interface ScoreHistoryViewProps {
    isSentToTeamOnly?: boolean;
    isAdmin?: boolean;
    initialCompetition?: string;
    showFilter?: boolean;
    lockedCompetitionId?: string;
    teamId?: string;
}

export default function ScoreHistoryView({
    isSentToTeamOnly = false,
    isAdmin = false,
    initialCompetition = 'all',
    showFilter = true,
    lockedCompetitionId,
    teamId
}: ScoreHistoryViewProps) {
    const [loading, setLoading] = useState(true);
    const [isDrawLoading, setIsDrawLoading] = useState(false);
    const [groupedScores, setGroupedScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [selectedTeamInGroup, setSelectedTeamInGroup] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompetition, setSelectedCompetition] = useState(lockedCompetitionId || initialCompetition);
    const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('all');
    const [liveSessions, setLiveSessions] = useState<Record<string, any>>({});
    const [drawTeamsCount, setDrawTeamsCount] = useState(2);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    const [competitions, setCompetitions] = useState<any[]>([]);
    const [drawState, setDrawState] = useState<'idle' | 'counting' | 'success'>('idle');
    const [countdown, setCountdown] = useState<number>(3);

    // Resolve slug to UUID if needed
    const selectedCompData = useMemo(() => {
        return competitions.find(c => c.id === selectedCompetition || c.type === selectedCompetition);
    }, [competitions, selectedCompetition]);

    const resolvedCompId = selectedCompData?.id || selectedCompetition;

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
        // Fetch latest from DB
        const scores = await fetchScoresFromSupabase();
        // Update view
        processScores(scores);
    };

    useSupabaseRealtime('scores', handleScoresUpdate);

    // Initial Load - try to fetch from DB first (for visitors), falling back to local
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Fetch competitions first to resolve slugs
                const comps = await fetchCompetitionsFromSupabase() as any[];
                setCompetitions(comps);

                const scores = await fetchScoresFromSupabase();
                if (scores && scores.length > 0) {
                    processScores(scores);
                } else {
                    processScores(getOfflineScores());
                }
            } catch (e) {
                console.error("Failed to fetch initial scores", e);
                processScores(getOfflineScores());
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Replaces loadScores but keeps the processing logic
    const processScores = (scoresList: any[], forceSelectId?: string) => {
        let offlineScores = scoresList;
        if (isSentToTeamOnly) {
            offlineScores = offlineScores.filter(s => s.isSentToTeam);
        }

        const allTeams = getTeams();

        // Helper to check if a comp is match based (using resolved data or slugs)
        const checkIsMatchBased = (compId: string) => {
            if (['fight', 'all_terrain', 'junior_all_terrain'].includes(compId)) return true;
            const comp = competitions.find(c => c.id === compId || c.type === compId);
            const category = comp?.category || comp?.type;
            return category && ['fight', 'all_terrain', 'junior_all_terrain'].includes(category);
        };

        const groups: Record<string, any> = {};

        // 1. Process existing scores
        offlineScores.forEach(score => {
            const isMatch = checkIsMatchBased(score.competitionType);

            // Normalize competitionType to slug if possible for consistent grouping
            const comp = competitions.find(c => c.id === score.competitionType || c.type === score.competitionType);
            const normalizedCompType = comp?.type || score.competitionType;

            if (isMatch && score.matchId) {
                // Group by matchId
                const key = score.matchId;
                if (!groups[key]) {
                    groups[key] = {
                        type: 'match',
                        matchId: key,
                        competitionType: normalizedCompType, // Store normalized
                        participants: [],
                        latestTimestamp: 0
                    };
                }

                let participant = groups[key].participants.find((p: any) => p.teamId === score.teamId);
                if (!participant) {
                    const team = allTeams.find(t => t.id === score.teamId || t.code === score.teamId);
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
                    const team = allTeams.find(t => t.id === score.teamId || t.code === score.teamId);
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
        allTeams.forEach(team => {
            if (!team.competition) return;

            // Check if this team is already present in ANY group for THIS competition
            // We normalize both types for comparison
            const teamCompSlug = team.competition;
            const teamCompUUID = competitions.find(c => c.type === teamCompSlug)?.id;

            const exists = Object.values(groups).some((g: any) => {
                const gComp = g.competitionType;
                const compMatches = gComp === teamCompSlug || gComp === teamCompUUID;
                if (!compMatches) return false;

                if (g.type === 'single') return g.teamId === team.id;
                return g.participants.some((p: any) => p.teamId === team.id);
            });

            if (!exists) {
                const key = `injected-${team.id}-${team.competition}`;
                groups[key] = {
                    type: 'single',
                    teamId: team.id,
                    team,
                    competitionType: team.competition,
                    submissions: [],
                    latestTimestamp: 0
                };
            }
        });

        // 3. Sort groups: Active ones first (by timestamp), then alphabetical for empty ones
        const sortedGroups = Object.values(groups).sort((a: any, b: any) => {
            if (b.latestTimestamp !== a.latestTimestamp) {
                return b.latestTimestamp - a.latestTimestamp;
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
        processScores(getOfflineScores(), forceSelectId);
    };

    const filteredGroups = useMemo(() => {
        const resolvedId = resolvedCompId.toLowerCase();
        const slug = selectedCompetition.toLowerCase();

        return groupedScores.filter(g => {
            // Match slug OR UUID
            const gComp = (g.competitionType || '').toLowerCase();
            const matchesComp = slug === 'all' || gComp === slug || gComp === resolvedId;

            // Phase filtering: 
            const matchesPhase = selectedPhaseFilter === 'all' ||
                (g.type === 'single' && (g.submissions?.length || 0) === 0) ||
                (g.type === 'match' && (g.participants?.every((p: any) => p.submissions?.length === 0) || false)) ||
                (g.type === 'single'
                    ? g.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                    : g.participants.some((p: any) => p.submissions.some((s: any) => s.phase === selectedPhaseFilter))
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
    }, [groupedScores, searchQuery, selectedCompetition, selectedPhaseFilter, resolvedCompId]);

    // Synchronize selection when competition changes
    useEffect(() => {
        if (filteredGroups.length > 0) {
            const stillExists = filteredGroups.some(g =>
                (g.type === 'single' && g.teamId === selectedGroup?.teamId && g.competitionType === selectedGroup?.competitionType) ||
                (g.type === 'match' && g.matchId === selectedGroup?.matchId)
            );
            if (!stillExists) {
                const first = filteredGroups[0];
                setSelectedGroup(first);
                if (first.type === 'single') {
                    // Default to filtered phase if available, else first submission phase, else empty
                    const targetPhase = selectedPhaseFilter !== 'all' && first.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                        ? selectedPhaseFilter
                        : (first.submissions[0]?.phase || '');
                    setActivePhase(targetPhase);
                    setSelectedTeamInGroup(null);
                } else if (first.participants?.length > 0) {
                    setSelectedTeamInGroup(first.participants[0].teamId);
                    const targetPhase = selectedPhaseFilter !== 'all' && first.participants[0].submissions.some((s: any) => s.phase === selectedPhaseFilter)
                        ? selectedPhaseFilter
                        : first.participants[0].submissions[0]?.phase || '';
                    setActivePhase(targetPhase);
                }
            } else if (selectedPhaseFilter !== 'all') {
                // If current selection still visible but phase changed, try to match it
                let hasFilteredPhase = false;
                if (selectedGroup.type === 'single') {
                    hasFilteredPhase = selectedGroup.submissions.some((s: any) => s.phase === selectedPhaseFilter);
                } else if (selectedTeamInGroup) {
                    const participant = selectedGroup.participants.find((p: any) => p.teamId === selectedTeamInGroup);
                    hasFilteredPhase = participant?.submissions.some((s: any) => s.phase === selectedPhaseFilter);
                }
                if (hasFilteredPhase) setActivePhase(selectedPhaseFilter);
            }
        } else {
            setSelectedGroup(null);
            setActivePhase('');
            setSelectedTeamInGroup(null);
        }
    }, [selectedCompetition, selectedPhaseFilter, filteredGroups]);

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

    const allCompetitionPhases = useMemo(() => {
        const phases = new Set<string>();
        const resolvedId = (resolvedCompId || "").toLowerCase();
        const slug = (selectedCompetition || "").toLowerCase();

        groupedScores.forEach(g => {
            const gComp = (g.competitionType || '').toLowerCase();
            if (slug === 'all' || gComp === slug || gComp === resolvedId) {
                if (g.type === 'single') {
                    g.submissions.forEach((s: any) => {
                        if (s.phase) phases.add(s.phase);
                    });
                } else {
                    g.participants.forEach((p: any) => p.submissions.forEach((s: any) => {
                        if (s.phase) phases.add(s.phase);
                    }));
                }
            }
        });

        // Ensure default phases for Line Follower even if no scores exist
        const isLF = slug.includes('line_follower') || resolvedId.includes('line_follower');
        if (isLF) {
            phases.add('essay_1');
            phases.add('essay_2');
        }

        return Array.from(phases).sort();
    }, [groupedScores, selectedCompetition, resolvedCompId]);

    const isMatchBasedComp = useMemo(() => {
        if (!selectedCompetition) return false;
        // Check hardcoded slug
        if (['fight', 'all_terrain', 'junior_all_terrain'].includes(selectedCompetition)) return true;
        // Check resolved category from DB
        const category = selectedCompData?.category || selectedCompData?.type;
        if (category && ['fight', 'all_terrain', 'junior_all_terrain'].includes(category)) return true;
        return false;
    }, [selectedCompetition, selectedCompData]);

    // Draw Logic: Should we show the "Start the Draw" initializer?
    const hasAnyScoresForCompetition = useMemo(() => {
        if (!selectedCompetition || selectedCompetition === 'all') return true; // Hide for 'all'

        const resolvedId = resolvedCompId.toLowerCase();
        const slug = selectedCompetition.toLowerCase();

        const compGroups = groupedScores.filter(g => {
            const gComp = (g.competitionType || '').toLowerCase();
            return gComp === slug || gComp === resolvedId;
        });

        if (isMatchBasedComp) {
            // For match-based, the "list is set" only if we have match groups
            return compGroups.some(g => g.type === 'match');
        } else {
            // For single, it's set if anyone has a score (or just teams exist)
            return compGroups.some(g => g.submissions && g.submissions.length > 0);
        }
    }, [groupedScores, selectedCompetition, isMatchBasedComp, resolvedCompId]);

    // Auto-select first phase if none selected or if current filter is invalid for current competition
    useEffect(() => {
        if (allCompetitionPhases.length > 0) {
            // If current filter is 'all' OR it's not in the available phases for this competition:
            const isInvalid = selectedPhaseFilter !== 'all' && !allCompetitionPhases.includes(selectedPhaseFilter);

            if (selectedPhaseFilter === 'all' || isInvalid) {
                console.log(`Phase filter '${selectedPhaseFilter}' is reset to '${allCompetitionPhases[0]}'`);
                setSelectedPhaseFilter(allCompetitionPhases[0]);
            }
        }
    }, [allCompetitionPhases, selectedPhaseFilter]);

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
            // Use the already resolved ID from useMemo
            const competitionId = resolvedCompId;
            const competitionType = (selectedCompData?.category || selectedCompData?.type || selectedCompetition).toLowerCase();

            console.log("Auto-draw starting for competition:", {
                selected: selectedCompetition,
                resolvedId: competitionId,
                type: competitionType
            });

            const allTeams = getTeams();
            // Filter teams by the resolved competition ID OR the slug OR the category name (case-insensitive)
            const compTeams = allTeams.filter(t => {
                const teamComp = (t.competition || '').toLowerCase();
                return teamComp === selectedCompetition.toLowerCase() ||
                    teamComp === competitionId.toLowerCase() ||
                    teamComp === competitionType;
            });

            console.log(`Found ${compTeams.length} teams for competition`);

            if (compTeams.length < 2) {
                alert(`Insufficient teams found for ${selectedCompData?.name || selectedCompetition} (Found ${compTeams.length}). Need at least 2 teams to perform a draw.`);
                setIsDrawLoading(false);
                return;
            }

            // Shuffle
            const shuffled = [...compTeams];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            const K = drawTeamsCount;
            // 1. Initial chunking (Primary K-sized matches)
            let chunks: any[][] = [];
            for (let i = 0; i < shuffled.length; i += K) {
                chunks.push([...shuffled.slice(i, i + K)]);
            }

            // 2. Adjust last groups based on user's specific iterative rules
            if (chunks.length > 1) {
                const lastIdx = chunks.length - 1;
                const r = chunks[lastIdx].length;

                if (r === 3) {
                    // "if it is 3 teams remaining make the last match with these 3 teams instead of 4"
                    // (Action: None needed, it's already 3)
                } else if (r === 2 && lastIdx >= 1) {
                    // "if it is 2 teams remaining then make the last two matches with 3 teams instead of 4"
                    // (K, 2) -> (K-1, 3)
                    const team = chunks[lastIdx - 1].pop();
                    if (team) chunks[lastIdx].unshift(team);
                } else if (r === 1) {
                    // "if it iis 1 team remaining then make the last 3 matches with 3 teams instead of 4"
                    if (lastIdx >= 2) {
                        // (K, K, 1) -> (K-1, K-1, 3)
                        const team1 = chunks[lastIdx - 1].pop();
                        const team2 = chunks[lastIdx - 2].pop();
                        if (team1) chunks[lastIdx].unshift(team1);
                        if (team2) chunks[lastIdx].unshift(team2);
                    } else if (lastIdx === 1) {
                        // Fallback for only 2 matches: (K, 1) -> (K-1, 2)
                        const team = chunks[lastIdx - 1].pop();
                        if (team) chunks[lastIdx].unshift(team);
                    }
                }
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
                            // OPTIMISTIC UPDATE: Create the local objects first to update UI instantly
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
                                        phase: 'qualifications',
                                        timestamp: Date.now(),
                                        totalPoints: 0,
                                        synced: true,
                                        isSentToTeam: false,
                                        status: 'pending'
                                    };
                                    newScores.push(scoreObj);
                                    pushPromises.push(pushScoreToSupabase(scoreObj as any));
                                });
                            });

                            // 1. Instantly update the local UI using current scores + new ones
                            console.log("Applying optimistic update to UI...");
                            processScores(newScores); // We use newScores here to force the UI to show matches immediately

                            // 2. Perform DB sync in background
                            console.log(`Syncing ${pushPromises.length} entries to Supabase...`);
                            await Promise.all(pushPromises);

                            // 3. Final sync to refresh everything from DB
                            await handleScoresUpdate();

                            // Reset state so it's ready for next time (though view will likely change)
                            // setTimeout(() => setDrawState('idle'), 500);
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
        if (confirm("DANGER: This will delete ALL score records from the database. This cannot be undone. Proceed?")) {
            setLoading(true);
            try {
                // Clear both remote and local storage
                await clearAllScoresFromSupabase();
                clearAllOfflineScores();

                await handleScoresUpdate();
                alert("Records cleared successfully.");
            } catch (e) {
                alert("Failed to clear records.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Sidebar: Tactical Log List */}
            <div className={`w-full lg:w-80 flex-col shrink-0 h-[600px] lg:h-[650px] ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-full overflow-hidden">
                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={handleClearAll}
                                className="px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                                Reset Registry
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
                                    <div className="relative group/select">
                                        <select
                                            value={selectedCompetition}
                                            onChange={(e) => setSelectedCompetition(e.target.value)}
                                            className="w-full bg-muted/50 border border-card-border pl-4 pr-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider outline-none focus:ring-1 focus:ring-role-primary/30 appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="all">ALL CATEGORIES</option>
                                            {competitions.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name.toUpperCase()} {liveSessions[cat.id] ? '(LIVE)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/select:text-role-primary transition-colors">
                                            <ChevronRight size={14} className="rotate-90" />
                                        </div>
                                    </div>

                                    <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mt-4 mb-3 px-1 flex items-center gap-2">
                                        <Layers size={12} className="text-role-primary" />
                                        {selectedCompetition.includes('line_follower') ? 'Phase Selection' : 'Strategic Phase'}
                                    </h2>
                                    <div className="flex flex-wrap gap-1.5 bg-muted/30 p-1.5 rounded-xl border border-card-border/50">
                                        {allCompetitionPhases.map((phase: string) => (
                                            <button
                                                key={phase}
                                                onClick={() => setSelectedPhaseFilter(phase)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedPhaseFilter === phase
                                                    ? 'bg-accent text-slate-900 shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
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
                                                        Match Group
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
                    {(isAdmin && isMatchBasedComp && (!hasAnyScoresForCompetition || drawState !== 'idle')) ? (
                        <motion.div
                            key="draw-interface"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center space-y-8 w-full"
                        >
                            {drawState === 'idle' && (
                                <>
                                    <div className="text-center space-y-2">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground">
                                            Start the Draw
                                        </h2>
                                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                                            Initialize Match Groupings
                                        </p>
                                    </div>

                                    <div className="p-8 bg-card border border-card-border rounded-3xl shadow-xl w-full max-w-md space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-role-primary/10 blur-[50px] rounded-full pointer-events-none" />

                                        <div className="space-y-4 relative z-10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                                    Teams per Card
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setDrawTeamsCount(Math.max(2, drawTeamsCount - 1))}
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center border border-card-border bg-muted/50 hover:bg-muted transition-colors text-xl font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <div className="flex-1 h-12 flex items-center justify-center bg-muted/30 rounded-xl border border-card-border">
                                                        <span className="text-xl font-black font-mono">{drawTeamsCount}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setDrawTeamsCount(drawTeamsCount + 1)}
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center border border-card-border bg-muted/50 hover:bg-muted transition-colors text-xl font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleAutoDraw}
                                                className="w-full py-4 bg-role-primary hover:bg-role-primary/90 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-role-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                <Layers size={18} />
                                                Confirm Draw
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase max-w-[200px] text-center leading-relaxed">
                                        This action will generate match cards for all registered teams in this category.
                                    </p>
                                </>
                            )}

                            {drawState === 'counting' && (
                                <motion.div
                                    key={`count-${countdown}`}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.5, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="flex flex-col items-center justify-center"
                                >
                                    <div className="text-[120px] font-black text-role-primary italic leading-none text-shadow-glow">
                                        {countdown}
                                    </div>
                                    <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs mt-4">
                                        Generating Bracket
                                    </p>
                                </motion.div>
                            )}

                            {drawState === 'success' && (
                                <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
                                    <div className="w-24 h-24 rounded-full bg-role-primary text-white flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(var(--role-primary),0.5)]">
                                        <ClipboardCheck size={48} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground text-center">
                                        The Matches Are Set
                                    </h2>
                                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">
                                        Good Luck To All Units
                                    </p>
                                </div>
                            )}
                        </motion.div>
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

