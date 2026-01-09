"use client";

import { motion } from 'framer-motion';
import { ClipboardCheck, History } from 'lucide-react';
import {
    JudgeActionCard,
    ActiveMatchesList,
    JudgeGuidelines
} from './components';
import { useJudgeDashboard } from './hooks/useJudgeDashboard';

export default function JudgeDashboard() {
    const { loading, data } = useJudgeDashboard();

    if (loading || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Action Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid md:grid-cols-2 gap-4 mb-8"
                >
                    <JudgeActionCard
                        href="/judge/score"
                        icon={ClipboardCheck}
                        title="Competition"
                        description="Submit official results for categories"
                        isPrimary
                    />
                    <JudgeActionCard
                        href="/judge/history"
                        icon={History}
                        title="Score History"
                        description="View and send score cards to teams"
                    />
                </motion.div>

                {/* Active Matches */}
                <ActiveMatchesList matches={data.activeMatches} />

                {/* Judge Guidelines */}
                <JudgeGuidelines guidelines={data.guidelines} />
            </div>
        </div>
    );
}
