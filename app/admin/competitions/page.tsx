"use client";

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Local imports
import { CompetitionCard } from './components';
import { getAdminCompetitions } from './services/competitionService';
import { CompetitionListItem } from './types';

export default function CompetitionsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'admin') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setCompetitions(getAdminCompetitions());
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
                    {competitions.map((comp, index) => (
                        <CompetitionCard key={comp.id} comp={comp} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}
