"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Send } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ANNOUNCEMENT_TYPES = [
    { value: 'info', label: 'Info', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'success', label: 'Success', color: 'bg-green-500/20 text-green-400' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500/20 text-red-400' },
];

const VISIBILITY_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'teams', label: 'Teams Only' },
    { value: 'judges', label: 'Judges Only' },
    { value: 'admins', label: 'Admins Only' },
];

const COMPETITIONS = [
    { id: 'all', title: 'Global (All Competitions)' },
    { id: '1', title: 'Junior Line Follower' },
    { id: '2', title: 'Junior All Terrain' },
    { id: '3', title: 'Line Follower' },
    { id: '4', title: 'All Terrain' },
    { id: '5', title: 'Fight (Battle Robots)' },
];

export default function AnnouncementsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        visibleTo: 'all',
        competitionId: 'all',
    });

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'admin') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setLoading(false);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabase.from('announcements').insert({
                title: formData.title,
                message: formData.message,
                type: formData.type,
                visible_to: formData.visibleTo,
                competition_id: formData.competitionId === 'all' ? null : parseInt(formData.competitionId),
            });

            if (error) throw error;

            // Reset form
            setFormData({
                title: '',
                message: '',
                type: 'info',
                visibleTo: 'all',
                competitionId: 'all',
            });
        } catch (err) {
            console.error('Failed to publish announcement:', err);
            alert('Failed to publish announcement');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Bell className="w-8 h-8 text-[var(--color-accent)]" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            Announcements
                        </h1>
                    </div>
                    <p className="text-gray-400">Publish global announcements to users</p>
                </motion.div>

                {/* Create Announcement Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-xl p-6 mb-8"
                >
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Plus size={20} />
                        New Announcement
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Match Schedule Update"
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Message
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Enter your announcement message..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                    required
                                >
                                    {ANNOUNCEMENT_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Visible To
                                </label>
                                <select
                                    value={formData.visibleTo}
                                    onChange={(e) => setFormData({ ...formData, visibleTo: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                    required
                                >
                                    {VISIBILITY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Target Competition
                                </label>
                                <select
                                    value={formData.competitionId}
                                    onChange={(e) => setFormData({ ...formData, competitionId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                    required
                                >
                                    {COMPETITIONS.map((comp) => (
                                        <option key={comp.id} value={comp.id}>
                                            {comp.title}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-xs text-gray-500">
                                    Choose "Global" to show this to everyone, or a specific category to tag it.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-6 py-3 bg-[var(--color-accent)] text-[var(--background)] rounded-lg font-bold shadow-lg shadow-[var(--color-accent)]/50 hover:shadow-[var(--color-accent)]/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            {submitting ? 'Publishing...' : 'Publish Announcement'}
                        </button>
                    </form>
                </motion.div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg"
                >
                    <p className="text-sm text-gray-400">
                        <strong className="text-white">Note:</strong> Announcements are sent in real-time to all connected users
                        matching the visibility criteria. Users will see a notification banner with your message.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
