"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Edit, Trash2, Play } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock data
const mockCompetitions = [
    {
        id: '1',
        title: 'Junior Line Follower',
        category: 'junior_line_follower',
        status: 'qualifiers',
        totalTeams: 12,
        totalMatches: 24,
    },
    {
        id: '2',
        title: 'Line Follower',
        category: 'line_follower',
        status: 'knockout',
        totalTeams: 20,
        totalMatches: 40,
    },
    {
        id: '3',
        title: 'Fight',
        category: 'fight',
        status: 'finals',
        totalTeams: 16,
        totalMatches: 28,
    },
];

export default function CompetitionsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
        return <div className="min-h-screen flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Content */}
                <div className="flex justify-end mb-8">
                    <Link href="/admin/competitions/create">
                        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--background)] rounded-lg font-semibold hover:bg-[var(--color-accent)]/90 transition-all">
                            <Plus size={18} />
                            Add Competition
                        </button>
                    </Link>
                </div>

                <div className="space-y-4">
                    {mockCompetitions.map((comp, index) => (
                        <motion.div
                            key={comp.id}
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
                    ))}
                </div>
            </div>
        </div>
    );
}
