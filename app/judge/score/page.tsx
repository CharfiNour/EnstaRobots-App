"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Loader2, CheckCircle, WifiOff, Wifi } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveScoreOffline, calculateTotalPoints, getUnsyncedScores, markScoreAsSynced } from '@/lib/offlineScores';

const COMPETITION_TYPES = [
    { value: 'line_follower', label: 'Line Follower' },
    { value: 'all_terrain', label: 'All Terrain' },
    { value: 'fight', label: 'Fight (Battle Robots)' },
];

export default function ScoreMatchPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    // Form state
    const [competitionType, setCompetitionType] = useState<'line_follower' | 'all_terrain' | 'fight'>('line_follower');
    const [matchId, setMatchId] = useState('');
    const [teamId, setTeamId] = useState('');

    // Line Follower / All Terrain fields
    const [timeMs, setTimeMs] = useState('');
    const [penalties, setPenalties] = useState('');
    const [bonusPoints, setBonusPoints] = useState('');

    // Fight fields
    const [knockouts, setKnockouts] = useState('');
    const [judgePoints, setJudgePoints] = useState('');
    const [damageScore, setDamageScore] = useState('');

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'judge') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setLoading(false);

        // Monitor online status
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

    // Sync offline scores when online
    useEffect(() => {
        if (isOnline && session) {
            syncOfflineScores();
        }
    }, [isOnline, session]);

    const syncOfflineScores = async () => {
        const unsyncedScores = getUnsyncedScores();

        for (const score of unsyncedScores) {
            try {
                const { error } = await supabase.from('scores').insert({
                    match_id: score.matchId,
                    team_id: score.teamId,
                    time_ms: score.timeMs,
                    penalties: score.penalties,
                    bonus_points: score.bonusPoints,
                    knockouts: score.knockouts,
                    judge_points: score.judgePoints,
                    damage_score: score.damageScore,
                    total_points: score.totalPoints,
                    judge_id: score.judgeId,
                });

                if (!error) {
                    markScoreAsSynced(score.id);
                }
            } catch (err) {
                console.error('Failed to sync score:', err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(false);

        const scoreData = {
            matchId,
            teamId,
            competitionType,
            timeMs: timeMs ? parseInt(timeMs) : undefined,
            penalties: penalties ? parseInt(penalties) : undefined,
            bonusPoints: bonusPoints ? parseInt(bonusPoints) : undefined,
            knockouts: knockouts ? parseInt(knockouts) : undefined,
            judgePoints: judgePoints ? parseInt(judgePoints) : undefined,
            damageScore: damageScore ? parseInt(damageScore) : undefined,
            totalPoints: 0,
            judgeId: session.userId,
        };

        // Calculate total points
        scoreData.totalPoints = calculateTotalPoints(competitionType, scoreData);

        if (isOnline) {
            // Try to submit directly
            try {
                const { error } = await supabase.from('scores').insert({
                    match_id: scoreData.matchId,
                    team_id: scoreData.teamId,
                    time_ms: scoreData.timeMs,
                    penalties: scoreData.penalties,
                    bonus_points: scoreData.bonusPoints,
                    knockouts: scoreData.knockouts,
                    judge_points: scoreData.judgePoints,
                    damage_score: scoreData.damageScore,
                    total_points: scoreData.totalPoints,
                    judge_id: scoreData.judgeId,
                });

                if (error) throw error;

                setSuccess(true);
                resetForm();
            } catch (err) {
                // Save offline if submission fails
                saveScoreOffline(scoreData);
                setSuccess(true);
            }
        } else {
            // Save offline
            saveScoreOffline(scoreData);
            setSuccess(true);
            resetForm();
        }

        setSubmitting(false);
        setTimeout(() => setSuccess(false), 3000);
    };

    const resetForm = () => {
        setMatchId('');
        setTeamId('');
        setTimeMs('');
        setPenalties('');
        setBonusPoints('');
        setKnockouts('');
        setJudgePoints('');
        setDamageScore('');
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
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <ClipboardCheck className="w-8 h-8 text-purple-400" />
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                                Score Match
                            </h1>
                        </div>

                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                            <span className="text-sm font-semibold">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-400">
                        {isOnline ? 'Scores will be submitted immediately' : 'Scores will be saved and synced when online'}
                    </p>
                </motion.div>

                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3 text-green-400"
                    >
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">
                            Score {isOnline ? 'submitted successfully' : 'saved offline and will sync when online'}!
                        </span>
                    </motion.div>
                )}

                {/* Score Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-6"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Competition Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Competition Type
                            </label>
                            <select
                                value={competitionType}
                                onChange={(e) => setCompetitionType(e.target.value as any)}
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                required
                            >
                                {COMPETITION_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Match ID & Team ID */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Match ID
                                </label>
                                <input
                                    type="text"
                                    value={matchId}
                                    onChange={(e) => setMatchId(e.target.value)}
                                    placeholder="match-123"
                                    className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Team ID
                                </label>
                                <input
                                    type="text"
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    placeholder="team-456"
                                    className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Conditional Fields */}
                        {(competitionType === 'line_follower' || competitionType === 'all_terrain') && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Time (milliseconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={timeMs}
                                        onChange={(e) => setTimeMs(e.target.value)}
                                        placeholder="45000"
                                        className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Penalties
                                        </label>
                                        <input
                                            type="number"
                                            value={penalties}
                                            onChange={(e) => setPenalties(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Bonus Points
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusPoints}
                                            onChange={(e) => setBonusPoints(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {competitionType === 'fight' && (
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Knockouts
                                    </label>
                                    <input
                                        type="number"
                                        value={knockouts}
                                        onChange={(e) => setKnockouts(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Judge Points
                                    </label>
                                    <input
                                        type="number"
                                        value={judgePoints}
                                        onChange={(e) => setJudgePoints(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Damage Score
                                    </label>
                                    <input
                                        type="number"
                                        value={damageScore}
                                        onChange={(e) => setDamageScore(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-bold text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <ClipboardCheck className="w-5 h-5" />
                                    Submit Score
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
