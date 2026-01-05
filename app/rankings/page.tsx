"use client";

import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { useState } from 'react';

// Mock data - will be replaced with Supabase
const rankingsData = {
    'Fight': [
        { rank: 1, team: 'TechTitans', points: 45, wins: 9, losses: 1, trend: 'up' },
        { rank: 2, team: 'BotBreakers', points: 42, wins: 8, losses: 2, trend: 'same' },
        { rank: 3, team: 'IronFighters', points: 38, wins: 7, losses: 3, trend: 'down' },
        { rank: 4, team: 'MechWarriors', points: 35, wins: 6, losses: 4, trend: 'up' },
    ],
    'Line Follower': [
        { rank: 1, team: 'SpeedRacers', points: 48, wins: 10, losses: 0, trend: 'up' },
        { rank: 2, team: 'QuickBots', points: 40, wins: 8, losses: 2, trend: 'up' },
        { rank: 3, team: 'FastLane', points: 36, wins: 7, losses: 3, trend: 'same' },
    ],
    'All Terrain': [
        { rank: 1, team: 'MountainBots', points: 50, wins: 10, losses: 0, trend: 'up' },
        { rank: 2, team: 'TerrainMasters', points: 44, wins: 8, losses: 2, trend: 'up' },
        { rank: 3, team: 'OffRoadKings', points: 39, wins: 7, losses: 3, trend: 'down' },
    ],
};

export default function RankingsPage() {
    const [selectedCategory, setSelectedCategory] = useState('Fight');

    const categories = Object.keys(rankingsData);

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
                        <Trophy className="w-10 h-10 text-[var(--color-accent)]" />
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Rankings
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg">Current standings across all competitions</p>
                </motion.div>

                {/* Category Tabs */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-accent text-background shadow-md shadow-accent/25'
                                : 'bg-muted text-muted-foreground hover:bg-card-foreground/10'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Rankings Table */}
                <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl overflow-hidden"
                >
                    {/* Table Header */}
                    <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-muted border-b border-card-border text-sm font-semibold text-muted-foreground uppercase">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-2">Team</div>
                        <div className="col-span-1 text-center">Points</div>
                        <div className="col-span-1 text-center">W/L</div>
                        <div className="col-span-1 text-center">Trend</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-[var(--color-card-border)]">
                        {rankingsData[selectedCategory as keyof typeof rankingsData].map((team, index) => (
                            <RankingRow key={team.team} team={team} index={index} />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function RankingRow({ team, index }: { team: any; index: number }) {
    const getMedalColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-300';
        if (rank === 3) return 'text-amber-600';
        return 'text-gray-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4 items-center transition-colors hover:bg-muted/50"
        >
            {/* Rank */}
            <div className="col-span-1 flex items-center gap-3">
                {team.rank <= 3 ? (
                    <Medal className={`w-6 h-6 ${getMedalColor(team.rank)}`} />
                ) : (
                    <span className="text-2xl font-bold text-muted-foreground/50 w-6 text-center">{team.rank}</span>
                )}
            </div>

            {/* Team Name */}
            <div className="col-span-2 font-bold text-foreground text-lg">{team.team}</div>

            {/* Points */}
            <div className="col-span-1 text-center">
                <div className="text-2xl font-bold text-accent">{team.points}</div>
                <div className="text-xs text-muted-foreground md:hidden">pts</div>
            </div>

            {/* W/L - Hidden on mobile, shown on desktop */}
            <div className="hidden md:block col-span-1 text-center">
                <span className="text-success font-semibold">{team.wins}</span>
                <span className="text-muted-foreground/30"> / </span>
                <span className="text-danger font-semibold">{team.losses}</span>
            </div>

            {/* Trend */}
            <div className="hidden md:flex col-span-1 justify-center">
                <TrendingUp
                    className={`w-5 h-5 ${team.trend === 'up'
                        ? 'text-success rotate-0'
                        : team.trend === 'down'
                            ? 'text-danger rotate-180'
                            : 'text-muted-foreground/50 rotate-90'
                        }`}
                />
            </div>
        </motion.div>
    );
}
