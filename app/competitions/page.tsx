"use client";

import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Users } from 'lucide-react';

const competitions = [
    {
        id: 1,
        title: 'Junior Line Follower',
        description: 'Young roboticists showcase their skills in precision line following. Perfect for beginners building their first autonomous robots.',
        status: 'Qualifiers',
        teams: 12,
        matches: 24,
        arena: 'Arena 1 & 2',
        schedule: 'Day 1-2',
        color: 'from-blue-500/20 to-[var(--color-card)]',
        borderColor: 'border-blue-500/50'
    },
    {
        id: 2,
        title: 'Junior All Terrain',
        description: 'Navigate challenging obstacles and terrain. Tests mechanical design and control systems for younger competitors.',
        status: 'Group Stage',
        teams: 16,
        matches: 32,
        arena: 'Arena 3',
        schedule: 'Day 1-3',
        color: 'from-green-500/20 to-[var(--color-card)]',
        borderColor: 'border-green-500/50'
    },
    {
        id: 3,
        title: 'Line Follower',
        description: 'The ultimate speed challenge. Advanced line-following robots compete for the fastest lap times.',
        status: 'Knockout',
        teams: 20,
        matches: 40,
        arena: 'Arena 1',
        schedule: 'Day 2-4',
        color: 'from-purple-500/20 to-[var(--color-card)]',
        borderColor: 'border-purple-500/50'
    },
    {
        id: 4,
        title: 'All Terrain',
        description: 'The most demanding robotics challenge. Robots must overcome complex obstacles, ramps, and varied surfaces.',
        status: 'Finals',
        teams: 18,
        matches: 36,
        arena: 'Arena 3 & 4',
        schedule: 'Day 3-5',
        color: 'from-orange-500/20 to-[var(--color-card)]',
        borderColor: 'border-orange-500/50'
    },
    {
        id: 5,
        title: 'Fight (Battle Robots)',
        description: 'Head-to-head combat. Robots battle for supremacy in the arena. Strategy, power, and innovation collide.',
        status: 'Live Now',
        teams: 16,
        matches: 28,
        arena: 'Main Arena',
        schedule: 'Day 4-5',
        color: 'from-red-500/20 to-[var(--color-card)]',
        borderColor: 'border-red-500/50',
        isLive: true
    },
];

export default function CompetitionsPage() {
    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-10 h-10 text-[var(--color-accent)]" />
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Competitions
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">Five categories, one champion in each. Who will rise to the top?</p>
                </motion.div>

                {/* Competition Cards */}
                <div className="space-y-6">
                    {competitions.map((comp, index) => (
                        <motion.div
                            key={comp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={`p-6 md:p-8 rounded-xl border backdrop-blur-sm transition-all cursor-pointer bg-gradient-to-br ${comp.color} ${comp.borderColor} ${comp.isLive ? 'shadow-lg shadow-red-500/20' : ''
                                }`}
                        >
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl md:text-3xl font-bold text-white">{comp.title}</h2>
                                        {comp.isLive && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                <span className="text-red-400 font-bold text-xs uppercase">Live</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{comp.description}</p>
                                </div>

                                <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                                    <span className="font-bold text-white">{comp.status}</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <StatItem icon={Users} label="Teams" value={comp.teams.toString()} />
                                <StatItem icon={Trophy} label="Matches" value={comp.matches.toString()} />
                                <StatItem icon={MapPin} label="Arena" value={comp.arena} />
                                <StatItem icon={Calendar} label="Schedule" value={comp.schedule} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tournament Format Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 p-8 bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl"
                >
                    <h3 className="text-2xl font-bold mb-4 text-white">Tournament Format</h3>
                    <div className="grid md:grid-cols-3 gap-6 text-gray-300">
                        <div>
                            <div className="font-bold text-[var(--color-accent)] mb-2">Group Stage</div>
                            <p className="text-sm">Teams compete in round-robin format. Top performers advance to knockout rounds.</p>
                        </div>
                        <div>
                            <div className="font-bold text-[var(--color-accent)] mb-2">Knockout</div>
                            <p className="text-sm">Single elimination brackets. Win or go home. Only the best move forward.</p>
                        </div>
                        <div>
                            <div className="font-bold text-[var(--color-accent)] mb-2">Finals</div>
                            <p className="text-sm">The ultimate showdown. Champions are crowned in each category.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Icon className="w-5 h-5 text-[var(--color-accent)]" />
            <div>
                <div className="text-xs text-gray-400 uppercase">{label}</div>
                <div className="font-bold text-white">{value}</div>
            </div>
        </div>
    );
}
