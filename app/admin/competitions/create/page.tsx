"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Local imports
import { CompetitionForm } from '../components';

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
            const { error } = await (supabase.from('competitions') as any).insert({
                id: formData.title.toLowerCase().replace(/\s+/g, '_'),
                name: formData.title,
                type: formData.category,
                profiles_locked: false,
                current_phase: formData.status
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
                    <CompetitionForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        submitLabel="Create Competition"
                    />
                </motion.div>
            </div>
        </div>
    );
}
