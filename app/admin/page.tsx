"use client";

import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Bell, Shield, History } from 'lucide-react';
import { StatCard, ActionCard, ActivityItem } from './components';
import { useAdminDashboard } from './hooks/useAdminDashboard';

export default function AdminDashboard() {
    const { loading, stats, activities } = useAdminDashboard();

    if (loading || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic flex items-center gap-4">
                            <Shield className="w-10 h-10 text-role-primary" />
                            Admin Console
                        </h1>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 opacity-60">
                            Global Competition Control & Systems Monitoring
                        </p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
                        icon={Calendar}
                        label="Upcoming"
                        value={stats.upcomingMatches.toString()}
                        color="text-green-400"
                        delay={0.2}
                    />
                    <StatCard
                        icon={Trophy}
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
                    <h2 className="text-xl font-bold mb-4 text-foreground">Quick Actions</h2>
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
                        <ActionCard
                            href="/admin/scores"
                            icon={History}
                            title="Score Registry"
                            description="Master data & deletions"
                            color="from-orange-500/20"
                        />
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-card-border rounded-xl p-6"
                >
                    <h2 className="text-xl font-bold mb-4 text-foreground">Recent Activity</h2>
                    <div className="space-y-3">
                        {activities.map((item, index) => (
                            <ActivityItem
                                key={index}
                                icon={item.icon}
                                text={item.text}
                                time={item.time}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
