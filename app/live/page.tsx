"use client";

import { motion } from 'framer-motion';
import { PlayCircle, Clock, MapPin, Trophy } from 'lucide-react';
import { useState } from 'react';

// Mock data - will be replaced with Supabase
const liveMatches = [
    {
        id: 1,
        competition: 'Fight',
        arena: 'Arena 1',
        team1: { name: 'TechTitans', score: 2 },
        team2: { name: 'BotBreakers', score: 1 },
        status: 'live',
        round: 'Finals',
        timeElapsed: '02:34'
    },
    {
        id: 2,
        competition: 'Line Follower',
        arena: 'Arena 2',
        team1: { name: 'SpeedRacers', score: 0 },
        team2: { name: 'QuickBots', score: 0 },
        status: 'upcoming',
        round: 'Semi-Finals',
        startTime: '14:30'
    }
];

const completedMatches = [
    {
        id: 3,
        competition: 'All Terrain',
        arena: 'Arena 3',
        team1: { name: 'MountainBots', score: 3 },
        team2: { name: 'TerrainMasters', score: 2 },
        status: 'completed',
        round: 'Quarter-Finals'
    }
];

export default function LivePage() {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = ['all', 'Fight', 'Line Follower', 'All Terrain'];

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <PlayCircle className="w-10 h-10 text-[var(--color-accent)]" />
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Live Center
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">Real-time matches and scores</p>
                </motion.div>

                {/* Category Filter */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-[var(--color-accent)] text-[var(--background)] shadow-lg shadow-[var(--color-accent)]/50'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                        >
                            {cat === 'all' ? 'All Matches' : cat}
                        </button>
                    ))}
                </div>

                {/* Live Matches */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Live Now
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {liveMatches.filter(m => m.status === 'live').map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </section>

                {/* Upcoming Matches */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Up Next</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {liveMatches.filter(m => m.status === 'upcoming').map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </section>

                {/* Completed Matches */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {completedMatches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function MatchCard({ match }: { match: any }) {
    const isLive = match.status === 'live';
    const isUpcoming = match.status === 'upcoming';

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-xl border backdrop-blur-sm transition-all ${isLive
                    ? 'bg-gradient-to-br from-red-500/20 to-[var(--color-card)] border-red-500/50 shadow-lg shadow-red-500/20'
                    : 'bg-[var(--color-card)] border-[var(--color-card-border)] hover:border-[var(--color-accent)]/50'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${isLive ? 'text-red-400' : 'text-[var(--color-accent)]'}`} />
                    <span className="font-bold text-white">{match.competition}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-400">{match.round}</span>
                </div>

                {isLive && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-red-400 font-bold text-xs uppercase">Live</span>
                    </div>
                )}
            </div>

            {/* Teams */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="font-semibold text-white">{match.team1.name}</span>
                    {!isUpcoming && (
                        <span className="text-2xl font-bold text-[var(--color-accent)]">{match.team1.score}</span>
                    )}
                </div>

                <div className="text-center text-gray-500 font-bold">VS</div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="font-semibold text-white">{match.team2.name}</span>
                    {!isUpcoming && (
                        <span className="text-2xl font-bold text-[var(--color-accent)]">{match.team2.score}</span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{match.arena}</span>
                </div>

                {isLive && (
                    <div className="flex items-center gap-2 text-[var(--color-accent)]">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{match.timeElapsed}</span>
                    </div>
                )}

                {isUpcoming && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Starts {match.startTime}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
