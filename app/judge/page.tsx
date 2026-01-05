"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Trophy, History, LogOut } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JudgeDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'judge') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
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
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <ClipboardCheck className="w-10 h-10 text-purple-400" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    Judge Dashboard
                                </h1>
                                <p className="text-gray-400">Score matches and manage competitions</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid md:grid-cols-2 gap-4 mb-8"
                >
                    <Link href="/judge/score">
                        <div className="p-6 bg-gradient-to-br from-purple-500/20 to-[var(--color-card)] border border-purple-500/50 rounded-xl hover:scale-105 transition-transform cursor-pointer">
                            <ClipboardCheck className="w-8 h-8 text-purple-400 mb-3" />
                            <h3 className="text-xl font-bold text-white mb-1">Score Match</h3>
                            <p className="text-gray-400 text-sm">Enter scores for a match</p>
                        </div>
                    </Link>

                    <Link href="/judge/history">
                        <div className="p-6 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:scale-105 transition-transform cursor-pointer">
                            <History className="w-8 h-8 text-gray-400 mb-3" />
                            <h3 className="text-xl font-bold text-white mb-1">Scoring History</h3>
                            <p className="text-gray-400 text-sm">View your past scores</p>
                        </div>
                    </Link>
                </motion.div>

                {/* Active Matches */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-6"
                >
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[var(--color-accent)]" />
                        Active Matches
                    </h2>

                    <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No matches ready for scoring</p>
                        <p className="text-sm text-gray-500 mt-2">Matches will appear here when they're ready</p>
                    </div>
                </motion.div>

                {/* Judge Guidelines */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl"
                >
                    <h3 className="text-lg font-bold text-white mb-3">Judge Guidelines 📋</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                        <li>• Scores are saved locally first and synced when online</li>
                        <li>• Double-check team names before submitting scores</li>
                        <li>• Each competition has different scoring criteria</li>
                        <li>• For Line Follower/All Terrain: Record time, penalties, and bonuses</li>
                        <li>• For Fight: Record knockouts, judge points, and damage scores</li>
                        <li>• Contact admin if you need to modify a submitted score</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
