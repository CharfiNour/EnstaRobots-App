"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
    { value: 'junior_line_follower', label: 'Junior Line Follower' },
    { value: 'junior_all_terrain', label: 'Junior All Terrain' },
    { value: 'line_follower', label: 'Line Follower' },
    { value: 'all_terrain', label: 'All Terrain' },
    { value: 'fight', label: 'Fight (Battle Robots)' },
];

const STATUSES = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'qualifiers', label: 'Qualifiers' },
    { value: 'group_stage', label: 'Group Stage' },
    { value: 'knockout', label: 'Knockout' },
    { value: 'finals', label: 'Finals' },
    { value: 'completed', label: 'Completed' },
];

export default function CreateCompetitionPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'line_follower',
        status: 'upcoming',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabase.from('competitions').insert({
                title: formData.title,
                category: formData.category,
                status: formData.status,
                description: formData.description,
            });

            if (error) throw error;

            router.push('/admin/competitions');
        } catch (err) {
            console.error('Failed to create competition:', err);
            alert('Failed to create competition');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link
                        href="/admin/competitions"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Competitions
                    </Link>

                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-[var(--color-accent)]" />
                        <h1 className="text-3xl font-bold text-white">
                            Create Competition
                        </h1>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-6"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Competition Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Senior Line Follower 2024"
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                required
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                required
                            >
                                {STATUSES.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the competition..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-6 py-3 bg-[var(--color-accent)] text-[var(--background)] rounded-lg font-bold text-lg shadow-lg shadow-[var(--color-accent)]/50 hover:shadow-[var(--color-accent)]/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {submitting ? 'Creating...' : 'Create Competition'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
