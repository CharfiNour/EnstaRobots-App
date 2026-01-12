"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck, ChevronRight, Shield, Target, Layers
} from 'lucide-react';
import { getOfflineScores } from '@/lib/offlineScores';
import { getTeams } from '@/lib/teams';
import ScoreCard from '@/components/jury/ScoreCard';
import { getCompetitionState } from '@/lib/competitionState';
import { fetchScoresFromSupabase } from '@/lib/supabaseData';
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
}

export default function ScoreHistoryView({
    isSentToTeamOnly = false,
    isAdmin = false,
    initialCompetition = 'all',
    showFilter = true,
    lockedCompetitionId
}: ScoreHistoryViewProps) {
    const [loading, setLoading] = useState(true);
    const [groupedScores, setGroupedScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [selectedTeamInGroup, setSelectedTeamInGroup] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompetition, setSelectedCompetition] = useState(lockedCompetitionId || initialCompetition);
    const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('all');
    const [liveSessions, setLiveSessions] = useState<Record<string, any>>({});

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
                const scores = await fetchScoresFromSupabase();
                if (scores && scores.length > 0) {
                    processScores(scores);
                } else {
                    processScores(getOfflineScores());
                }
            } catch (e) {
                console.error("Failed to fetch initial scores", e);
                processScores(getOfflineScores());
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
        // Determine if competition is match-based
        const isMatchBased = (compType: string) => ['fight', 'all_terrain', 'junior_all_terrain'].includes(compType);

        const groups: Record<string, any> = {};
        offlineScores.forEach(score => {
            if (isMatchBased(score.competitionType)) {
                // Group by matchId for match-based competitions
                const key = score.matchId;
                if (!groups[key]) {
                    groups[key] = {
                        type: 'match',
                        matchId: key,
                        competitionType: score.competitionType,
                        participants: [],
                        latestTimestamp: 0
                    };
                }
                const team = allTeams.find(t => t.id === score.teamId || t.name === score.teamId);
                // Add participant if not already added
                if (!groups[key].participants.find((p: any) => p.teamId === score.teamId)) {
                    groups[key].participants.push({
                        teamId: score.teamId,
                        team,
                        submissions: [score]
                    });
                } else {
                    // Add to existing participant's submissions
                    const participant = groups[key].participants.find((p: any) => p.teamId === score.teamId);
                    participant.submissions.push(score);
                }
                if (score.timestamp > groups[key].latestTimestamp) {
                    groups[key].latestTimestamp = score.timestamp;
                }
            } else {
                // Single team grouping (Line Follower style)
                const key = score.teamId + '-' + score.competitionType;
                if (!groups[key]) {
                    const team = allTeams.find(t => t.id === score.teamId || t.name === score.teamId);
                    groups[key] = {
                        type: 'single',
                        teamId: score.teamId,
                        team,
                        competitionType: score.competitionType || team?.competition,
                        submissions: [],
                        latestTimestamp: 0
                    };
                }
                groups[key].submissions.push(score);
                if (score.timestamp > groups[key].latestTimestamp) {
                    groups[key].latestTimestamp = score.timestamp;
                }
            }
        });

        const sortedGroups = Object.values(groups).sort((a: any, b: any) => b.latestTimestamp - a.latestTimestamp);
        setGroupedScores(sortedGroups);

        // Selection logic (simplified reuse)
        if (forceSelectId) {
            const forced = sortedGroups.find(g => g.teamId === forceSelectId || g.matchId === forceSelectId);
            if (forced) {
                setSelectedGroup(forced);
                if (forced.type === 'single') {
                    setActivePhase(forced.submissions[0].phase);
                    setSelectedTeamInGroup(null);
                } else if (forced.participants?.length > 0) {
                    setSelectedTeamInGroup(forced.participants[0].teamId);
                    setActivePhase(forced.participants[0].submissions[0]?.phase || '');
                }
            }
        } else if (sortedGroups.length > 0 && !selectedGroup) {
            const first = sortedGroups[0];
            setSelectedGroup(first);
            if (first.type === 'single') {
                setActivePhase(first.submissions[0].phase);
                setSelectedTeamInGroup(null);
            } else if (first.participants?.length > 0) {
                setSelectedTeamInGroup(first.participants[0].teamId);
                setActivePhase(first.participants[0].submissions[0]?.phase || '');
            }
        }

        setLoading(false);
    };

    // Kept for backward compat or manual triggers if needed, but redirects to processScores
    const loadScores = (forceSelectId?: string) => {
        // Fallback to local if called manually without data
        processScores(getOfflineScores(), forceSelectId);
    };

    const filteredGroups = useMemo(() => {
        return groupedScores.filter(g => {
            const matchesComp = selectedCompetition === 'all' || g.competitionType === selectedCompetition;

            // Phase filtering
            const matchesPhase = selectedPhaseFilter === 'all' || (
                g.type === 'single'
                    ? g.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                    : g.participants.some((p: any) => p.submissions.some((s: any) => s.phase === selectedPhaseFilter))
            );

            if (!matchesComp || !matchesPhase) return false;

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
    }, [groupedScores, searchQuery, selectedCompetition, selectedPhaseFilter]);

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
                    // Default to filtered phase if available
                    const targetPhase = selectedPhaseFilter !== 'all' && first.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                        ? selectedPhaseFilter
                        : first.submissions[0].phase;
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
    }, [selectedCompetition, selectedPhaseFilter]);

    // Get current score data for display - must be before any returns to maintain hook order
    const currentScoreGroup = useMemo(() => {
        if (!selectedGroup) return null;
        if (selectedGroup.type === 'single') {
            return selectedGroup;
        } else if (selectedGroup.type === 'match' && selectedTeamInGroup) {
            const participant = selectedGroup.participants.find((p: any) => p.teamId === selectedTeamInGroup);
            if (participant) {
                return {
                    type: 'single',
                    teamId: participant.teamId,
                    team: participant.team,
                    competitionType: selectedGroup.competitionType,
                    submissions: participant.submissions,
                    latestTimestamp: selectedGroup.latestTimestamp
                };
            }
        }
        return null;
    }, [selectedGroup, selectedTeamInGroup]);

    // Get available phases for selected group/team - must be before any returns
    const availablePhases = useMemo(() => {
        if (!currentScoreGroup?.submissions) return [];
        const phases = currentScoreGroup.submissions.map((s: any) => s.phase);
        return [...new Set(phases)] as string[];
    }, [currentScoreGroup]);

    const allCompetitionPhases = useMemo(() => {
        const phases = new Set<string>();
        groupedScores.forEach(g => {
            if (selectedCompetition === 'all' || g.competitionType === selectedCompetition) {
                if (g.type === 'single') {
                    g.submissions.forEach((s: any) => phases.add(s.phase));
                } else {
                    g.participants.forEach((p: any) => p.submissions.forEach((s: any) => phases.add(s.phase)));
                }
            }
        });
        return Array.from(phases).sort();
    }, [groupedScores, selectedCompetition]);

    // Auto-select first phase if none selected or if 'all' is chosen but hidden
    useEffect(() => {
        if (selectedPhaseFilter === 'all' && allCompetitionPhases.length > 0) {
            setSelectedPhaseFilter(allCompetitionPhases[0]);
        }
    }, [allCompetitionPhases, selectedPhaseFilter]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentScore = currentScoreGroup?.submissions?.find((s: any) => s.phase === activePhase) || currentScoreGroup?.submissions?.[0];
    const lockedComp = lockedCompetitionId ? COMPETITION_CATEGORIES.find(c => c.id === lockedCompetitionId) : null;

    const handleSelectTeam = (group: any, teamId?: string) => {
        setSelectedGroup(group);
        if (group.type === 'single') {
            const targetPhase = selectedPhaseFilter !== 'all' && group.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                ? selectedPhaseFilter
                : group.submissions[0].phase;
            setActivePhase(targetPhase);
            setSelectedTeamInGroup(null);
        } else if (group.type === 'match' && teamId) {
            setSelectedTeamInGroup(teamId);
            const participant = group.participants.find((p: any) => p.teamId === teamId);
            if (participant?.submissions?.length > 0) {
                const targetPhase = selectedPhaseFilter !== 'all' && participant.submissions.some((s: any) => s.phase === selectedPhaseFilter)
                    ? selectedPhaseFilter
                    : participant.submissions[0].phase;
                setActivePhase(targetPhase);
            }
        }
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

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Sidebar: Tactical Log List */}
            <div className="w-full lg:w-80 flex flex-col shrink-0 lg:h-[650px]">
                <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-full overflow-hidden">
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
                                            {COMPETITION_CATEGORIES.map(cat => (
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
                                                                        <div className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest truncate">
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
                                                        <div className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest truncate">
                                                            {group.team?.club || 'Club Unknown'}
                                                        </div>
                                                        <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                                        <div className="text-[7px] font-bold text-muted-foreground uppercase opacity-40 truncate">
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
            <div className="flex-1 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative lg:h-[650px] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {currentScoreGroup && currentScore ? (
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
