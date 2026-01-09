"use client";

import { motion } from 'framer-motion';
import { HomeStatCardProps } from '../types';

export default function HomeStatCard({ icon: Icon, label, value }: HomeStatCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-center p-6 rounded-lg bg-card border border-card-border backdrop-blur-sm shadow-md shadow-black/[0.02]"
        >
            <Icon className="w-8 h-8 mx-auto mb-3 text-accent" />
            <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">{label}</div>
        </motion.div>
    );
}
