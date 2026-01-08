"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck, Loader2, CheckCircle, WifiOff, Wifi,
    ChevronDown, User, Shield, Info, Timer, Trophy, ChevronRight
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveScoreOffline, calculateTotalPoints, getOfflineScores } from '@/lib/offlineScores';
import { getTeams, Team } from '@/lib/teams';
import { startLiveSession, stopLiveSession, getCompetitionState } from '@/lib/competitionState';

const COMPETITIONS = [
    { value: 'junior_line_follower', label: 'Junior Line Follower', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { value: 'junior_all_terrain', label: 'Junior All Terrain', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { value: 'line_follower', label: 'Line Follower', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { value: 'all_terrain', label: 'All Terrain', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { value: 'fight', label: 'Fight (Battle Robots)', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { value: 'homologation', label: 'Homologation', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
];

const PHASES_LINE_FOLLOWER = [
    { value: 'essay_1', label: 'Essay 1' },
    { value: 'essay_2', label: 'Essay 2' },
];

const PHASES_DEFAULT = [
    { value: 'qualifications', label: 'Qualifications' },
    { value: 'quarter_final', label: 'Quarter Final' },
    { value: 'semi_final', label: 'Semi Final' },
    { value: 'final', label: 'Final' },
];

const STATUS_OPTIONS = [
    { value: 'winner', label: 'Winner', color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'qualified', label: 'Qualified', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'eliminated', label: 'Eliminated', color: 'text-red-600 dark:text-red-400' },
];

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export default function ScoreCardPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [success, setSuccess] = useState(false);
    const [showCompList, setShowCompList] = useState(false);
    const router = useRouter();

    // Judges
    const [judge1, setJudge1] = useState('');
    const [judge2, setJudge2] = useState('');

    // Competition Context
    const [competition, setCompetition] = useState(COMPETITIONS[2]); // Default to Line Follower
    const [globalPhase, setGlobalPhase] = useState('qualifications');

    // Teams State
    const [numberOfTeams, setNumberOfTeams] = useState(2);
    const [teams, setTeams] = useState<{ id: string, phase?: string, status?: string }[]>([
        { id: '', phase: 'essay_1' },
    ]);

    // New Team Ordering & Live Logic
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [competitionTeams, setCompetitionTeams] = useState<Team[]>([]);
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        // Load sorted teams
        const loaded = getTeams();
        setAllTeams(loaded);

        // Sync Live State
        const syncState = () => {
            const state = getCompetitionState();
            setIsLive(state.isLive);
            if (state.isLive && state.activeTeamId) {
                setTeams(prev => {
                    const copy = [...prev];
                    if (copy[0] && !copy[0].id) copy[0].id = state.activeTeamId!;
                    return copy;
                });
            }
        };

        syncState();
        window.addEventListener('competition-state-updated', syncState);
        window.addEventListener('storage', syncState);

        return () => {
            window.removeEventListener('competition-state-updated', syncState);
            window.removeEventListener('storage', syncState);
        };
    }, []);

    // Filter teams when competition or allTeams changes
    useEffect(() => {
        const filtered = allTeams.filter(t => t.competition === competition.value);
        setCompetitionTeams(filtered);
        // If we have teams and the current input is empty, pre-fill with the first team
        if (filtered.length > 0 && !teams[0].id && !isLive) {
            setCurrentTeamIndex(0);
            const newTeams = [...teams];
            newTeams[0].id = filtered[0].id;

            // Check for phase too for the first team
            if (isLineFollower) {
                const existingScores = getOfflineScores();
                const hasEssay1 = existingScores.some(s =>
                    s.teamId === filtered[0].id &&
                    s.competitionType === competition.value &&
                    s.phase === 'essay_1'
                );
                newTeams[0].phase = hasEssay1 ? 'essay_2' : 'essay_1';
            }
            setTeams(newTeams);
        }
    }, [competition, allTeams]);

    const handleNextCard = () => {
        if (competitionTeams.length === 0) return;

        let nextIndex = currentTeamIndex + 1;
        if (nextIndex >= competitionTeams.length) nextIndex = 0; // Wrap around or stop? User implied list order. Let's wrap for convenience or just stop. 
        // User said "next card will have the next team name by the list order".
        // Let's safe guard overflow
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
                s.competitionType === competition.value &&
                s.phase === 'essay_1'
            );
            newTeams[0].phase = hasEssay1 ? 'essay_2' : 'essay_1';
        }

        setTeams(newTeams);
    };

    const handleStartMatch = () => {
        // Find current team ID being scored (first input team)
        const activeTeamId = teams[0].id;
        if (activeTeamId) {
            setIsLive(true);
            const phase = isLineFollower ? (teams[0].phase || 'essay_1') : globalPhase;
            startLiveSession(activeTeamId, phase);
        } else {
            alert("Please select a team or ensure teams are loaded.");
        }
    };

    const handleEndMatch = () => {
        stopLiveSession();
        setIsLive(false);
    };

    // Line Follower / Homologation fields
    const [timeMinutes, setTimeMinutes] = useState('');
    const [timeSeconds, setTimeSeconds] = useState('');
    const [timeMillis, setTimeMillis] = useState('');
    const [completedRoad, setCompletedRoad] = useState(false);
    const [homologationPoints, setHomologationPoints] = useState('');

    // Fight / Other fields
    const [knockouts, setKnockouts] = useState('');
    const [judgePoints, setJudgePoints] = useState('');
    const [damageScore, setDamageScore] = useState('');

    const isLineFollower = ['line_follower', 'junior_line_follower'].includes(competition.value);

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'judge') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setLoading(false);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [router]);

    // Logic for single vs multi-team based on competition
    useEffect(() => {
        if (isLineFollower) {
            setTeams([{ id: '', phase: 'essay_1' }]);
        } else {
            setTeams([
                { id: '', status: 'qualified' },
                { id: '', status: 'qualified' }
            ]);
            setNumberOfTeams(2);
            setGlobalPhase('qualifications');
        }
    }, [competition]);

    // Update number of teams for non-LF
    useEffect(() => {
        if (!isLineFollower) {
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
    }, [numberOfTeams, isLineFollower]);

    const handleTeamChange = (index: number, field: string, value: string) => {
        const newTeams = [...teams];
        newTeams[index] = { ...newTeams[index], [field]: value };

        // If it's a Line Follower and the ID changed, check for existing Essay 1
        if (isLineFollower && field === 'id' && value.trim() !== '') {
            const existingScores = getOfflineScores();
            const hasEssay1 = existingScores.some(s =>
                s.teamId === value &&
                s.competitionType === competition.value &&
                s.phase === 'essay_1'
            );
            if (hasEssay1) {
                newTeams[index].phase = 'essay_2';
            } else {
                newTeams[index].phase = 'essay_1';
            }
        }

        setTeams(newTeams);
    };

    // Check if a phase has already been submitted for a team
    const isPhaseSubmitted = (teamId: string, phase: string): boolean => {
        if (!teamId.trim()) return false;
        const existingScores = getOfflineScores();
        return existingScores.some(s =>
            s.teamId === teamId &&
            s.competitionType === competition.value &&
            s.phase === phase
        );
    };

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

        const matchId = `match_${generateId()}`;
        const totalTimeMs = isLineFollower ?
            (parseInt(timeMinutes || '0') * 60000) + (parseInt(timeSeconds || '0') * 1000) + parseInt(timeMillis || '0')
            : undefined;

        const payloads = teams.map(team => {
            const bonuses = isLineFollower && homologationPoints ? parseInt(homologationPoints) : 0;
            const kos = !isLineFollower && knockouts ? parseInt(knockouts) : 0;
            const jpts = !isLineFollower && judgePoints ? parseInt(judgePoints) : 0;
            const dmg = !isLineFollower && damageScore ? parseInt(damageScore) : 0;

            const score = calculateTotalPoints(competition.value, {
                timeMs: totalTimeMs,
                bonusPoints: bonuses,
                knockouts: kos,
                judgePoints: jpts,
                damageScore: dmg
            });

            return {
                id: generateId(),
                matchId,
                teamId: team.id,
                competitionType: competition.value,
                phase: isLineFollower ? team.phase : globalPhase,
                judgeId: session.userId,
                judgeNames: [judge1, judge2],
                timeMs: totalTimeMs,
                completedRoad: isLineFollower ? completedRoad : undefined,
                bonusPoints: bonuses,
                knockouts: kos,
                judgePoints: jpts,
                damageScore: dmg,
                penalties: 0,
                timestamp: Date.now(),
                totalPoints: score,
                isSentToTeam: true,
                status: team.status
            };
        });

        let hasError = false;
        for (const payload of payloads) {
            const dbPayload = {
                match_id: payload.matchId,
                team_id: payload.teamId,
                competition_type: payload.competitionType,
                phase: payload.phase,
                time_ms: payload.timeMs,
                penalties: 0,
                bonus_points: payload.bonusPoints,
                knockouts: payload.knockouts,
                judge_points: payload.judgePoints,
                damage_score: payload.damageScore,
                judge_id: payload.judgeId,
                judge_names: payload.judgeNames,
                is_completed: payload.completedRoad,
                total_points: payload.totalPoints,
                is_sent_to_team: true,
                status: payload.status
            };

            if (isOnline) {
                try {
                    const { error } = await supabase.from('scores').insert(dbPayload);
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
            setTimeMinutes('');
            setTimeSeconds('');
            setTimeMillis('');
            setCompletedRoad(false);
            setHomologationPoints('');
            setKnockouts('');
            setJudgePoints('');
            setDamageScore('');

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
                        s.competitionType === competition.value &&
                        s.phase === 'essay_1'
                    );
                    newTeams[0].phase = hasEssay1 ? 'essay_2' : 'essay_1';
                }
                setTeams(newTeams);
            } else {
                setTeams(teams.map(t => ({ ...t, id: '', phase: isLineFollower ? 'essay_1' : undefined })));
            }

            setTimeout(() => setSuccess(false), 3000);
        }
        setSubmitting(false);
    };

    const resetForm = () => {
        setTeams(teams.map(t => ({ ...t, id: '' })));
        setTimeMinutes('');
        setTimeSeconds('');
        setTimeMillis('');
        setCompletedRoad(false);
        setHomologationPoints('');
        setKnockouts('');
        setJudgePoints('');
        setDamageScore('');
        setJudge1('');
        setJudge2('');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header Actions */}
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={handleNextCard}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-black uppercase tracking-widest text-xs transition-all active:scale-95 border border-card-border"
                    >
                        <span>Next Card</span>
                        <ChevronRight size={16} />
                    </button>

                    {isLive ? (
                        <button
                            onClick={handleEndMatch}
                            className="flex items-center gap-3 px-6 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>
                                {isLineFollower
                                    ? `Finish ${teams[0].phase === 'essay_1' ? 'Phase 1' : 'Phase 2'}`
                                    : `Finish ${globalPhase === 'qualifications' ? 'Quals'
                                        : globalPhase === 'quarter_final' ? 'Quarter F'
                                            : globalPhase === 'semi_final' ? 'Semi F'
                                                : globalPhase === 'final' ? 'Final' : 'Match'}`
                                }
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStartMatch}
                            className="px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all active:scale-95"
                        >
                            {isLineFollower
                                ? `Start ${teams[0].phase === 'essay_1' ? 'Phase 1' : 'Phase 2'}`
                                : `Start ${globalPhase === 'qualifications' ? 'Quals'
                                    : globalPhase === 'quarter_final' ? 'Quarter F'
                                        : globalPhase === 'semi_final' ? 'Semi F'
                                            : globalPhase === 'final' ? 'Final' : 'Match'}`
                            }
                        </button>
                    )}
                </div>

                {/* Competition Selector Button */}
                <div className="mb-6 relative">
                    <button
                        onClick={() => setShowCompList(!showCompList)}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${competition.bg} ${competition.border} group hover:shadow-xl`}
                    >
                        <div className="flex items-center gap-4">
                            <Shield className={`w-6 h-6 ${competition.color}`} />
                            <span className={`text-lg font-black ${competition.color}`}>{competition.label}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 ${competition.color} transition-transform ${showCompList ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showCompList && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden"
                            >
                                {COMPETITIONS.map((comp) => (
                                    <button
                                        key={comp.value}
                                        onClick={() => {
                                            setCompetition(comp);
                                            setShowCompList(false);
                                        }}
                                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 ${competition.value === comp.value ? 'bg-muted font-bold' : ''}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${comp.bg} border-2 ${comp.border}`} />
                                        <span className={`text-sm font-bold ${comp.color}`}>{comp.label}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-card-border rounded-2xl p-4 md:p-6 shadow-2xl relative"
                >
                    {!isLive && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                            <div className="bg-card border border-card-border p-4 rounded-xl shadow-xl flex items-center gap-2 text-muted-foreground font-bold">
                                <Info size={18} />
                                <span>Press Start to unlock score card</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity duration-300 ${!isLive ? 'opacity-40 pointer-events-none' : ''}`}>

                        {/* Judges Section */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest pl-1">
                                    <User size={12} className="text-accent" />
                                    Judge 1 Full Name
                                </label>
                                <input
                                    type="text"
                                    value={judge1}
                                    onChange={(e) => setJudge1(e.target.value)}
                                    placeholder="Enter judge name"
                                    className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest pl-1">
                                    <User size={12} className="text-accent" />
                                    Judge 2 Full Name
                                </label>
                                <input
                                    type="text"
                                    value={judge2}
                                    onChange={(e) => setJudge2(e.target.value)}
                                    placeholder="Enter judge name"
                                    className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="w-full h-px bg-card-border" />

                        {/* Teams Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                                    <Shield size={18} className="text-accent" />
                                    Teams & Competition Phases
                                </h2>
                                {!isLineFollower && (
                                    <div className="flex gap-2">
                                        <div className="flex items-center bg-muted/50 border border-card-border rounded-lg px-2 py-1 gap-2">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">Phase</span>
                                            <select
                                                value={globalPhase}
                                                onChange={(e) => setGlobalPhase(e.target.value)}
                                                className="bg-transparent text-xs font-black text-accent outline-none cursor-pointer"
                                            >
                                                {PHASES_DEFAULT.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center bg-muted/50 border border-card-border rounded-lg px-2 py-1 gap-2">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">Count</span>
                                            <select
                                                value={numberOfTeams}
                                                onChange={(e) => setNumberOfTeams(parseInt(e.target.value))}
                                                className="bg-transparent text-xs font-black text-foreground outline-none cursor-pointer"
                                            >
                                                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Teams</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-3">
                                {teams.map((team, index) => {
                                    const phaseToCheck = isLineFollower ? team.phase : globalPhase;
                                    const hasSubmitted = isPhaseSubmitted(team.id, phaseToCheck!);

                                    return (
                                        <div key={index} className="flex flex-col md:flex-row gap-3 p-4 rounded-xl bg-muted/20 border border-card-border group transition-all hover:bg-muted/40 shadow-sm">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 block tracking-wider">
                                                    {isLineFollower ? 'Robot Name' : `Team ${index + 1} Robot`}
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={team.id}
                                                        onChange={(e) => handleTeamChange(index, 'id', e.target.value)}
                                                        className={`w-full px-3 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm font-bold text-foreground appearance-none cursor-pointer ${hasSubmitted ? 'border-red-500 dark:border-red-400' : 'border-card-border'}`}
                                                        required
                                                    >
                                                        <option value="">Select Robot...</option>
                                                        {competitionTeams.map((t) => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                                {hasSubmitted && (
                                                    <div className="text-[9px] font-bold text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                                                        <Info size={8} /> Already submitted for {phaseToCheck?.replace(/_/g, ' ')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="md:w-48 px-2">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 block tracking-wider">
                                                    {isLineFollower ? 'Attempt Phase' : 'Match Outcome'}
                                                </label>
                                                {isLineFollower ? (
                                                    <select
                                                        value={team.phase}
                                                        onChange={(e) => handleTeamChange(index, 'phase', e.target.value)}
                                                        className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm font-black text-accent cursor-pointer"
                                                    >
                                                        {PHASES_LINE_FOLLOWER.map(p => {
                                                            const isSubmitted = isPhaseSubmitted(team.id, p.value);
                                                            return (
                                                                <option
                                                                    key={p.value}
                                                                    value={p.value}
                                                                    disabled={isSubmitted}
                                                                >
                                                                    {p.label}{isSubmitted ? ' (Submitted)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                ) : (
                                                    <select
                                                        value={team.status}
                                                        onChange={(e) => handleTeamChange(index, 'status', e.target.value)}
                                                        className={`w-full px-3 py-2.5 bg-background border border-card-border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm font-black uppercase cursor-pointer ${STATUS_OPTIONS.find(o => o.value === team.status)?.color
                                                            }`}
                                                    >
                                                        {STATUS_OPTIONS.map(o => (
                                                            <option key={o.value} value={o.value} className={o.color}>{o.label}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="w-full h-px bg-card-border" />

                        {/* Detail Scoring */}
                        <div>
                            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-tight">
                                <Info size={18} className="text-accent" />
                                Performance Data
                            </h3>

                            {isLineFollower ? (
                                <div className="space-y-4">
                                    {/* Time Input */}
                                    <div className="bg-muted/30 p-6 rounded-2xl border border-card-border shadow-inner">
                                        <label className="block text-[10px] font-black text-muted-foreground uppercase mb-4 text-center tracking-[0.25em] opacity-60">
                                            Recorded Duration
                                        </label>
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    value={timeMinutes}
                                                    onChange={e => setTimeMinutes(e.target.value)}
                                                    placeholder="00"
                                                    className="w-20 px-2 py-5 text-center text-3xl font-mono bg-background border border-card-border rounded-2xl focus:ring-2 focus:ring-accent outline-none text-foreground shadow-sm"
                                                />
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Min</span>
                                            </div>
                                            <span className="text-3xl font-black text-muted-foreground opacity-30 mt-[-20px]">:</span>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    value={timeSeconds}
                                                    onChange={e => setTimeSeconds(e.target.value)}
                                                    placeholder="00"
                                                    className="w-20 px-2 py-5 text-center text-3xl font-mono bg-background border border-card-border rounded-2xl focus:ring-2 focus:ring-accent outline-none text-foreground shadow-sm"
                                                />
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Sec</span>
                                            </div>
                                            <span className="text-3xl font-black text-muted-foreground opacity-30 mt-[-20px]">:</span>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    value={timeMillis}
                                                    onChange={e => setTimeMillis(e.target.value)}
                                                    placeholder="000"
                                                    className="w-20 px-2 py-4 text-center text-2xl font-mono bg-background border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-foreground shadow-sm"
                                                />
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ms</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 bg-muted/20 border border-card-border rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`p-1.5 rounded-lg ${completedRoad ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                                    <Timer size={16} />
                                                </div>
                                                <span className={`text-xs font-black uppercase tracking-wider ${completedRoad ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                                    Road Complete
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCompletedRoad(!completedRoad)}
                                                className={`w-10 h-6 rounded-full relative transition-colors shadow-inner ${completedRoad ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: completedRoad ? 20 : 3 }}
                                                    className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md"
                                                />
                                            </button>
                                        </div>

                                        <div className="relative p-4 bg-muted/20 border border-card-border rounded-xl shadow-sm">
                                            <input
                                                type="number"
                                                value={homologationPoints}
                                                onChange={(e) => setHomologationPoints(e.target.value)}
                                                placeholder="Homologation"
                                                className="w-full bg-transparent focus:outline-none font-black text-base text-foreground"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase opacity-40">
                                                PTS
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 font-mono">Knockouts</label>
                                        <input
                                            type="number"
                                            value={knockouts}
                                            onChange={(e) => setKnockouts(e.target.value)}
                                            className="w-full px-4 py-4 bg-muted/20 border border-card-border rounded-2xl text-2xl font-black outline-none text-center text-foreground shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 font-mono">Judges</label>
                                        <input
                                            type="number"
                                            value={judgePoints}
                                            onChange={(e) => setJudgePoints(e.target.value)}
                                            className="w-full px-4 py-4 bg-muted/20 border border-card-border rounded-2xl text-2xl font-black outline-none text-center text-foreground shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 font-mono">Damage</label>
                                        <input
                                            type="number"
                                            value={damageScore}
                                            onChange={(e) => setDamageScore(e.target.value)}
                                            className="w-full px-4 py-4 bg-muted/20 border border-card-border rounded-2xl text-2xl font-black outline-none text-center text-foreground shadow-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full mt-6 px-8 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform active:scale-[0.98] ${competition.bg.replace('10', '90')} bg-accent text-white uppercase italic tracking-widest`}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting Official Result...
                                </>
                            ) : (
                                <>
                                    <Trophy className="w-5 h-5 text-white" />
                                    Submit Result
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

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
            </div>
        </div>
    );
}
