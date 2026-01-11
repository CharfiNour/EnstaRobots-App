"use client";

import { motion } from 'framer-motion';
import { ClipboardCheck, History } from 'lucide-react';
import {
    JudgeActionCard,
    ActiveMatchesList,
    JudgeGuidelines,
    JudgeDashboardHeader
} from './components';
import { useJudgeDashboard } from './hooks/useJudgeDashboard';

export default function JudgeDashboard() {
    const { loading, data } = useJudgeDashboard();

    if (loading || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Synchronizing Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Tactical Header */}
                <JudgeDashboardHeader />

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Primary Operations: Small Cards */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-5">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <JudgeActionCard
                                    href="/judge/score"
                                    icon={ClipboardCheck}
                                    title="Score Management"
                                    description="Record tactical performance data and verify official scores for active categories."
                                    isPrimary
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <JudgeActionCard
                                    href="/judge/history"
                                    icon={History}
                                    title="Score List"
                                    description="Review previous scorecards, verify registry sync, and dispatch reports to teams."
                                />
                            </motion.div>
                        </div>

                        {/* Guidelines */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <JudgeGuidelines guidelines={data.guidelines} />
                        </motion.div>
                    </div>

                    {/* Secondary Intelligence: Active Matches List */}
                    <div className="lg:col-span-4">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="h-full"
                        >
                            <ActiveMatchesList matches={data.activeMatches} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
