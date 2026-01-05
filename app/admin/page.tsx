"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Trophy, Users, Calendar, Bell, FileDown, LogOut, TrendingUp } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Mock stats - will be replaced with real Supabase queries
    const stats = {
        totalCompetitions: 5,
        totalTeams: 48,
        totalMatches: 156,
        liveMatches: 2,
        upcomingMatches: 12,
        pendingScores: 3,
    };

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'admin') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-10 h-10 text-[var(--color-accent)]" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    Admin Dashboard
                                </h1>
                                <p className="text-gray-400">Manage EnstaRobots World Cup</p>
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

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatCard
                        icon={Trophy}
                        label="Competitions"
                        value={stats.totalCompetitions.toString()}
                        color="text-yellow-400"
                        delay={0}
                    />
                    <StatCard
                        icon={Users}
                        label="Teams"
                        value={stats.totalTeams.toString()}
                        color="text-blue-400"
                        delay={0.05}
                    />
                    <StatCard
                        icon={Calendar}
                        label="Total Matches"
                        value={stats.totalMatches.toString()}
                        color="text-purple-400"
                        delay={0.1}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Live Matches"
                        value={stats.liveMatches.toString()}
                        color="text-red-400"
                        delay={0.15}
                        highlight
                    />
                    <StatCard
                        icon={Calendar}
                        label="Upcoming"
                        value={stats.upcomingMatches.toString()}
                        color="text-green-400"
                        delay={0.2}
                    />
                    <StatCard
                        icon={FileDown}
                        label="Pending Scores"
                        value={stats.pendingScores.toString()}
                        color="text-orange-400"
                        delay={0.25}
                    />
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ActionCard
                            href="/admin/competitions"
                            icon={Trophy}
                            title="Competitions"
                            description="Manage competitions & phases"
                            color="from-yellow-500/20"
                        />
                        <ActionCard
                            href="/admin/teams"
                            icon={Users}
                            title="Teams"
                            description="Add and manage teams"
                            color="from-blue-500/20"
                        />
                        <ActionCard
                            href="/admin/matches"
                            icon={Calendar}
                            title="Matches"
                            description="Schedule and assign arenas"
                            color="from-purple-500/20"
                        />
                        <ActionCard
                            href="/admin/announcements"
                            icon={Bell}
                            title="Announcements"
                            description="Publish global alerts"
                            color="from-green-500/20"
                        />
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-6"
                >
                    <h2 className="text-xl font-bold mb-4 text-white">Recent Activity</h2>
                    <div className="space-y-3">
                        <ActivityItem
                            icon={Trophy}
                            text="Competition 'Fight' status changed to Finals"
                            time="5 minutes ago"
                        />
                        <ActivityItem
                            icon={Users}
                            text="New team 'RoboWarriors' added to All Terrain"
                            time="12 minutes ago"
                        />
                        <ActivityItem
                            icon={Calendar}
                            text="Match scheduled: Arena 1 at 14:30"
                            time="1 hour ago"
                        />
                        <ActivityItem
                            icon={Bell}
                            text="Announcement published to all teams"
                            time="2 hours ago"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    delay,
    highlight,
}: {
    icon: any;
    label: string;
    value: string;
    color: string;
    delay: number;
    highlight?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={`p-4 rounded-xl border backdrop-blur-sm ${highlight
                    ? 'bg-gradient-to-br from-red-500/20 to-[var(--color-card)] border-red-500/50'
                    : 'bg-[var(--color-card)] border-[var(--color-card-border)]'
                }`}
        >
            <Icon className={`w-6 h-6 mb-2 ${color}`} />
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
        </motion.div>
    );
}

function ActionCard({
    href,
    icon: Icon,
    title,
    description,
    color,
}: {
    href: string;
    icon: any;
    title: string;
    description: string;
    color: string;
}) {
    return (
        <Link href={href}>
            <div className={`p-6 bg-gradient-to-br ${color} to-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl hover:scale-105 transition-transform cursor-pointer`}>
                <Icon className="w-8 h-8 text-white mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </Link>
    );
}

function ActivityItem({ icon: Icon, text, time }: { icon: any; text: string; time: string }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <Icon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{text}</p>
                <p className="text-xs text-gray-500 mt-1">{time}</p>
            </div>
        </div>
    );
}
