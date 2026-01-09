"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { HomeCompetitionCardProps } from '../types';

export default function HomeCompetitionCard({
    id,
    title,
    description,
    status,
    delay,
    isLive = false,
    isViewAll = false
}: HomeCompetitionCardProps) {
    const content = (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ scale: 1.03, boxShadow: isLive ? "0 10px 40px rgba(0,188,212,0.15)" : "0 10px 30px rgba(0,0,0,0.04)" }}
            className={`p-6 h-full rounded-xl border transition-all cursor-pointer shadow-md shadow-black/[0.02] ${isLive
                ? 'bg-gradient-to-br from-accent/10 to-card border-accent'
                : isViewAll
                    ? 'bg-muted/50 border-dashed border-card-border hover:border-accent/50'
                    : 'bg-card border-card-border hover:border-accent/50'
                }`}
        >
            {isLive && (
                <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                    </span>
                    <span className="text-accent font-bold text-sm uppercase tracking-wider">Live Now</span>
                </div>
            )}

            <h3 className="text-2xl font-bold mb-2 text-foreground">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>

            {status && !isLive && (
                <div className="inline-block px-3 py-1 bg-foreground/5 backdrop-blur-sm rounded-full text-xs font-semibold text-muted-foreground border border-card-border">
                    {status}
                </div>
            )}

            {isViewAll && (
                <div className="text-accent font-semibold flex items-center gap-2">
                    See Schedule <span className="text-xl">→</span>
                </div>
            )}
        </motion.div>
    );

    if (isViewAll) return <Link href="/competitions">{content}</Link>;
    return <Link href={`/competitions/${id}`}>{content}</Link>;
}
