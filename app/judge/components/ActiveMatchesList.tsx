"use client";

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { JudgeDashboardData } from '../types';

interface ActiveMatchesListProps {
    matches: JudgeDashboardData['activeMatches'];
}

export default function ActiveMatchesList({ matches }: ActiveMatchesListProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-6"
        >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-role-primary" />
                Active Matches
            </h2>

            {matches.length === 0 ? (
                <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No matches ready for scoring</p>
                    <p className="text-sm text-muted-foreground/50 mt-2">Matches will appear here when they're ready</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Render active matches here */}
                </div>
            )}
        </motion.div>
    );
}
