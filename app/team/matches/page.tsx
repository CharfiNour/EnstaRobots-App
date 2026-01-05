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
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
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
                        <Calendar className="w-8 h-8 text-accent" />
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                            My Matches
                        </h1>
                    </div>
                    <p className="text-muted-foreground">Schedule and results for {session?.teamName}</p>
                </motion.div>

                {/* Upcoming Matches */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        <Clock className="w-5 h-5 text-accent" />
                        Upcoming Matches
                    </h2>

                    {upcomingMatches.length === 0 ? (
                        <div className="p-8 bg-card border border-card-border rounded-xl text-center shadow-md shadow-black/[0.02]">
                            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No upcoming matches scheduled yet</p>
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
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        <Trophy className="w-5 h-5 text-muted-foreground" />
                        Past Results
                    </h2>

                    {completedMatches.length === 0 ? (
                        <div className="p-8 bg-card border border-card-border rounded-xl text-center shadow-md shadow-black/[0.02]">
                            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No completed matches yet</p>
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
            className="p-6 bg-gradient-to-br from-accent/5 to-card border border-accent/20 rounded-xl shadow-md shadow-black/[0.02]"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="text-sm text-muted-foreground mb-1">{match.competition}</div>
                    <h3 className="text-lg font-bold text-foreground">{match.round}</h3>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-accent">{timeLeft}</div>
                    <div className="text-xs text-muted-foreground">until match</div>
                </div>
            </div>

            {/* Matchup */}
            <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg border border-card-border/30">
                <div className="text-center flex-1">
                    <div className="text-sm text-muted-foreground mb-1">You</div>
                    <div className="font-bold text-foreground">{teamName}</div>
                </div>
                <div className="px-4 text-muted-foreground/30 font-bold">VS</div>
                <div className="text-center flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Opponent</div>
                    <div className="font-bold text-foreground">{match.opponent}</div>
                </div>
            </div>

            {/* Details */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{match.arena}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
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
            className="p-6 bg-card border border-card-border rounded-xl hover:border-accent/50 transition-all shadow-md shadow-black/[0.02]"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="text-sm text-muted-foreground mb-1">{match.competition}</div>
                    <h3 className="text-lg font-bold text-foreground">{match.round}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isWin ? (
                        <>
                            <CheckCircle className="w-6 h-6 text-success" />
                            <span className="font-bold text-success">Win</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-6 h-6 text-danger" />
                            <span className="font-bold text-danger">Loss</span>
                        </>
                    )}
                </div>
            </div>

            {/* Scores */}
            <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg border border-card-border/30">
                <div className="text-center flex-1">
                    <div className="text-sm text-muted-foreground mb-1">You</div>
                    <div className="font-bold text-foreground mb-1">{teamName}</div>
                    <div className={`text-3xl font-bold ${isWin ? 'text-success' : 'text-muted-foreground'}`}>
                        {match.yourScore}
                    </div>
                </div>
                <div className="px-4 text-muted-foreground/30 font-bold">-</div>
                <div className="text-center flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Opponent</div>
                    <div className="font-bold text-foreground mb-1">{match.opponent}</div>
                    <div className={`text-3xl font-bold ${!isWin ? 'text-danger' : 'text-muted-foreground'}`}>
                        {match.opponentScore}
                    </div>
                </div>
            </div>

            {/* Arena */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{match.arena}</span>
            </div>
        </motion.div>
    );
}
