"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Trophy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Mock data - will be replaced with Supabase
const mockMatches = [
    {
        id: '1',
        round: 'Qualifiers - Round 1',
        arena: 'Arena 1',
        opponent: 'SpeedRacers',
        status: 'upcoming',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        competition: 'Line Follower',
    },
    {
        id: '2',
        round: 'Qualifiers - Round 2',
        arena: 'Arena 2',
        opponent: 'QuickBots',
        status: 'upcoming',
        scheduledTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
        competition: 'Line Follower',
    },
    {
        id: '3',
        round: 'Practice',
        arena: 'Arena 1',
        opponent: 'FastLane',
        status: 'completed',
        result: 'win',
        yourScore: 45,
        opponentScore: 38,
        competition: 'Line Follower',
    },
    {
        id: '4',
        round: 'Practice',
        arena: 'Arena 2',
        opponent: 'TurboTrack',
        status: 'completed',
        result: 'loss',
        yourScore: 32,
        opponentScore: 41,
        competition: 'Line Follower',
    },
];

export default function TeamMatchesPage() {
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
                <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
            </div>
        );
    }

    const upcomingMatches = mockMatches.filter(m => m.status === 'upcoming');
    const completedMatches = mockMatches.filter(m => m.status === 'completed');

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
                        <Calendar className="w-8 h-8 text-[var(--color-accent)]" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            My Matches
                        </h1>
                    </div>
                    <p className="text-gray-400">Schedule and results for {session?.teamName}</p>
                </motion.div>

                {/* Upcoming Matches */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[var(--color-accent)]" />
                        Upcoming Matches
                    </h2>

                    {upcomingMatches.length === 0 ? (
                        <div className="p-8 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl text-center">
                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No upcoming matches scheduled yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingMatches.map((match, index) => (
                                <UpcomingMatchCard key={match.id} match={match} index={index} teamName={session?.teamName} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Past Results */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-gray-400" />
                        Past Results
                    </h2>

                    {completedMatches.length === 0 ? (
                        <div className="p-8 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl text-center">
                            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No completed matches yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {completedMatches.map((match, index) => (
                                <CompletedMatchCard key={match.id} match={match} index={index} teamName={session?.teamName} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function UpcomingMatchCard({ match, index, teamName }: { match: any; index: number; teamName: string }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const matchTime = new Date(match.scheduledTime).getTime();
            const distance = matchTime - now;

            if (distance < 0) {
                setTimeLeft('Starting soon!');
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${minutes}m`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [match.scheduledTime]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-card)] border border-[var(--color-accent)]/30 rounded-xl"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="text-sm text-gray-400 mb-1">{match.competition}</div>
                    <h3 className="text-lg font-bold text-white">{match.round}</h3>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--color-accent)]">{timeLeft}</div>
                    <div className="text-xs text-gray-400">until match</div>
                </div>
            </div>

            {/* Matchup */}
            <div className="flex items-center justify-between mb-4 p-4 bg-white/5 rounded-lg">
                <div className="text-center flex-1">
                    <div className="text-sm text-gray-400 mb-1">You</div>
                    <div className="font-bold text-white">{teamName}</div>
                </div>
                <div className="px-4 text-gray-500 font-bold">VS</div>
                <div className="text-center flex-1">
                    <div className="text-sm text-gray-400 mb-1">Opponent</div>
                    <div className="font-bold text-white">{match.opponent}</div>
                </div>
            </div>

            {/* Details */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{match.arena}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </motion.div>
    );
}

function CompletedMatchCard({ match, index, teamName }: { match: any; index: number; teamName: string }) {
    const isWin = match.result === 'win';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:border-[var(--color-card-border)]/50 transition-all"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="text-sm text-gray-400 mb-1">{match.competition}</div>
                    <h3 className="text-lg font-bold text-white">{match.round}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isWin ? (
                        <>
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <span className="font-bold text-green-400">Win</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-6 h-6 text-red-400" />
                            <span className="font-bold text-red-400">Loss</span>
                        </>
                    )}
                </div>
            </div>

            {/* Scores */}
            <div className="flex items-center justify-between mb-4 p-4 bg-white/5 rounded-lg">
                <div className="text-center flex-1">
                    <div className="text-sm text-gray-400 mb-1">You</div>
                    <div className="font-bold text-white mb-1">{teamName}</div>
                    <div className={`text-3xl font-bold ${isWin ? 'text-green-400' : 'text-gray-400'}`}>
                        {match.yourScore}
                    </div>
                </div>
                <div className="px-4 text-gray-500 font-bold">-</div>
                <div className="text-center flex-1">
                    <div className="text-sm text-gray-400 mb-1">Opponent</div>
                    <div className="font-bold text-white mb-1">{match.opponent}</div>
                    <div className={`text-3xl font-bold ${!isWin ? 'text-red-400' : 'text-gray-400'}`}>
                        {match.opponentScore}
                    </div>
                </div>
            </div>

            {/* Arena */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{match.arena}</span>
            </div>
        </motion.div>
    );
}
