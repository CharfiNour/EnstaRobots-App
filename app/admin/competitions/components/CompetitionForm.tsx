"use client";

import { Save } from 'lucide-react';
import { CATEGORIES, PHASES } from '../services/competitionService';

interface CompetitionFormProps {
    formData: {
        title: string;
        category: string;
        status: string;
        description: string;
    };
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
    submitLabel: string;
}

export default function CompetitionForm({
    formData,
    setFormData,
    onSubmit,
    submitting,
    submitLabel
}: CompetitionFormProps) {
    // Determine which phases to show based on current category selection
    const currentPhases = formData.category.includes('line') ? PHASES.line : PHASES.standard;

    return (
        <form onSubmit={onSubmit} className="space-y-6">
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
                    onChange={(e) => {
                        const newCat = e.target.value;
                        const newPhases = newCat.includes('line') ? PHASES.line : PHASES.standard;
                        setFormData({
                            ...formData,
                            category: newCat,
                            status: newPhases[0] // Set to first available phase for the new category
                        });
                    }}
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
                    Current Phase
                </label>
                <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all uppercase text-xs tracking-widest font-black"
                    required
                >
                    {currentPhases.map((phase) => (
                        <option key={phase} value={phase} className="bg-slate-900">
                            {phase}
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
                    className="w-full px-4 py-3 bg-white/5 border border-[var(--color-card-border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-[var(--color-accent)] text-[var(--background)] rounded-lg font-bold text-lg shadow-lg shadow-[var(--color-accent)]/50 hover:shadow-[var(--color-accent)]/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Save size={20} />
                {submitting ? 'Processing...' : submitLabel}
            </button>
        </form>
    );
}
