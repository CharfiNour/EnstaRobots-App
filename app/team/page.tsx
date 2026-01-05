"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, User, LogOut } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                            <Trophy className="w-10 h-10 text-[var(--color-accent)]" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    {session?.teamName}
                                </h1>
                                <p className="text-gray-400">Team Dashboard</p>
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

                    <div className="p-4 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <User size={16} />
                            Team Code
                        </div>
                        <div className="font-mono text-xl text-[var(--color-accent)] font-bold">
                            {session?.teamCode}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid md:grid-cols-2 gap-4 mb-8"
                >
                    <Link href="/team/matches">
                        <div className="p-6 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-card)] border border-[var(--color-accent)]/50 rounded-xl hover:scale-105 transition-transform cursor-pointer">
                            <Calendar className="w-8 h-8 text-[var(--color-accent)] mb-3" />
                            <h3 className="text-xl font-bold text-white mb-1">My Matches</h3>
                            <p className="text-gray-400 text-sm">View schedule and results</p>
                        </div>
                    </Link>

                    <Link href="/live">
                        <div className="p-6 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:scale-105 transition-transform cursor-pointer">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="text-red-400 font-bold text-xs uppercase">Live</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Watch Live</h3>
                            <p className="text-gray-400 text-sm">See what's happening now</p>
                        </div>
                    </Link>
                </motion.div>

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-xl"
                >
                    <h3 className="text-lg font-bold text-white mb-3">Welcome to EnstaRobots World Cup! 🏆</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                        <li>• Check your upcoming matches in the Matches tab</li>
                        <li>• Arrive 15 minutes before your scheduled match time</li>
                        <li>• Make sure your robot is ready and tested</li>
                        <li>• Watch live matches to see your competition</li>
                        <li>• Good luck and have fun!</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
