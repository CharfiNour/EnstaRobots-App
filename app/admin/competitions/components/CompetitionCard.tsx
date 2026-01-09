"use client";

import { motion } from 'framer-motion';
import { Edit, Play, Trash2 } from 'lucide-react';
import { CompetitionListItem } from '../types';

interface CompetitionCardProps {
    comp: CompetitionListItem;
    index: number;
}

export default function CompetitionCard({ comp, index }: CompetitionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{comp.title}</h3>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">{comp.totalTeams} teams</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">{comp.totalMatches} matches</span>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-lg font-semibold text-sm ${comp.status === 'finals' ? 'bg-red-500/20 text-red-400' :
                    comp.status === 'knockout' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                    }`}>
                    {comp.status.replace('_', ' ').toUpperCase()}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                    <Edit size={14} />
                    Edit
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
                    <Play size={14} />
                    Change Phase
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm text-red-400 transition-all">
                    <Trash2 size={14} />
                    Delete
                </button>
            </div>
        </motion.div>
    );
}
