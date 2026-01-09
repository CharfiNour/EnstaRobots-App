"use client";

import { motion } from 'framer-motion';
import { JudgeDashboardData } from '../types';

interface JudgeGuidelinesProps {
    guidelines: JudgeDashboardData['guidelines'];
}

export default function JudgeGuidelines({ guidelines }: JudgeGuidelinesProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 bg-muted border border-card-border rounded-xl"
        >
            <h3 className="text-lg font-bold text-foreground mb-3">Judge Guidelines 📋</h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
                {guidelines.map((guideline, index) => (
                    <li key={index}>• {guideline}</li>
                ))}
            </ul>
        </motion.div>
    );
}
