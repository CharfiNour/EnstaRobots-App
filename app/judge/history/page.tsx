"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle, Clock, Trophy } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getOfflineScores } from '@/lib/offlineScores';

export default function JudgeHistoryPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'judge') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);

        // Load offline scores
        const offlineScores = getOfflineScores();
        setScores(offlineScores.reverse()); // Most recent first

        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <History className="w-8 h-8 text-purple-400" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            Scoring History
                        </h1>
                    </div>
                    <p className="text-gray-400">Your submitted scores</p>
                </motion.div>

                {/* Scores List */}
                {scores.length === 0 ? (
                    <div className="p-8 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl text-center">
                        <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No scores submitted yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {scores.map((score, index) => (
                            <motion.div
                                key={score.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-6 rounded-xl border ${score.synced
                                        ? 'bg-[var(--color-card)] border-[var(--color-card-border)]'
                                        : 'bg-yellow-500/10 border-yellow-500/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">
                                            {score.competitionType.replace('_', ' ').toUpperCase()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-[var(--color-accent)]" />
                                            <span className="font-bold text-white">
                                                Team {score.teamId}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {score.synced ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-sm">
                                                <CheckCircle size={14} />
                                                Synced
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-400 text-sm">
                                                <Clock size={14} />
                                                Pending
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-lg">
                                    {score.competitionType !== 'fight' && (
                                        <>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">Time</div>
                                                <div className="font-bold text-white">
                                                    {score.timeMs ? `${(score.timeMs / 1000).toFixed(2)}s` : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">Penalties</div>
                                                <div className="font-bold text-red-400">{score.penalties || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">Bonus</div>
                                                <div className="font-bold text-green-400">{score.bonusPoints || 0}</div>
                                            </div>
                                        </>
                                    )}

                                    {score.competitionType === 'fight' && (
                                        <>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">KOs</div>
                                                <div className="font-bold text-white">{score.knockouts || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">Judge Pts</div>
                                                <div className="font-bold text-white">{score.judgePoints || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">Damage</div>
                                                <div className="font-bold text-white">{score.damageScore || 0}</div>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Total</div>
                                        <div className="text-2xl font-bold text-[var(--color-accent)]">
                                            {score.totalPoints}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 text-xs text-gray-500">
                                    {new Date(score.timestamp).toLocaleString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
