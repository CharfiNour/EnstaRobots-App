"use client";

import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Bell, Shield, History, Key, Trash2, AlertTriangle } from 'lucide-react';
import { StatCard, ActionCard, ActivityItem } from './components';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { clearAllScoresFromSupabase, clearAllLiveSessionsFromSupabase } from '@/lib/supabaseData';

export default function AdminDashboard() {
    const { loading, stats, activities, updateStat, persistStats } = useAdminDashboard();

    if (loading || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleGlobalReset = async () => {
        if (confirm("DANGER: This will delete ALL score records, matches, and live sessions for ALL competitions. This cannot be undone. Area you sure you want to end the test phase and clear everything?")) {
            if (confirm("FINAL WARNING: All history and results will be permanently erased. Proceed with cleanup?")) {
                try {
                    await Promise.all([
                        clearAllScoresFromSupabase(),
                        clearAllLiveSessionsFromSupabase()
                    ]);
                    alert("System Cleaned: All test data has been erased.");
                    window.location.reload();
                } catch (e) {
                    console.error("Cleanup failed", e);
                    alert("Failed to clear data. Check console for details.");
                }
            }
        }
    };

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={Trophy}
                        label="Competitions"
                        value={stats.totalCompetitions.toString()}
                        color="text-yellow-400"
                        delay={0}
                        onChange={(val) => updateStat('totalCompetitions', Number(val) || 0)}
                        onSave={() => persistStats()}
                    />
                    <StatCard
                        icon={Users}
                        label="Teams"
                        value={stats.totalTeams.toString()}
                        color="text-blue-400"
                        delay={0.05}
                        onChange={(val) => updateStat('totalTeams', Number(val) || 0)}
                        onSave={() => persistStats()}
                    />
                    <StatCard
                        icon={Calendar}
                        label="Matches"
                        value={stats.totalMatches.toString()}
                        color="text-purple-400"
                        delay={0.1}
                        onChange={(val) => updateStat('totalMatches', Number(val) || 0)}
                        onSave={() => persistStats()}
                    />
                    <StatCard
                        icon={Calendar}
                        label="Event Duration"
                        value={stats.eventDuration}
                        color="text-green-400"
                        delay={0.15}
                        onChange={(val) => updateStat('eventDuration', val)}
                        onSave={() => persistStats()}
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
                            icon={Key}
                            title="Security Codes"
                            description="Auth keys & staff access"
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

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                    className="mb-8 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle className="w-32 h-32 text-red-500" />
                    </div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase text-red-500 mb-1">Danger Zone</h3>
                            <p className="text-sm text-red-500/70 mb-4 max-w-xl">
                                Test Phase Complete? Use this action to permanently purge all accumulated score data, match history, and active sessions from the database. This action is irreversible.
                            </p>
                            <button
                                onClick={handleGlobalReset}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={14} />
                                Global Factory Reset
                            </button>
                        </div>
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
