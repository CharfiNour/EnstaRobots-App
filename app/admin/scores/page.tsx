"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { History, Shield, Activity, Terminal, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';

export default function AdminScoresPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const session = getSession();
        if (!session || session.role !== 'admin') {
            router.push('/login');
        } else {
            setIsLoading(false);
        }
    }, [router]);

    if (isLoading) return null;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-role-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-role-primary/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent pointer-events-none" />
            </div>

            {/* Header */}
            <div className="container mx-auto px-6 py-8 md:py-12 max-w-7xl relative z-10">
                <div className="mb-12">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                        <History className="w-8 h-8 text-accent" />
                        Score Registry Console
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2">
                        Master record authority and live score synchronization
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="relative z-10 px-6 md:px-8 pb-12 flex-1 flex flex-col">
                <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
                    <ScoreHistoryView isAdmin={true} />
                </div>
            </main>

            {/* Tactical Footer Overlay */}
            <div className="fixed bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-role-primary/30 to-transparent z-50 overflow-hidden">
                <div className="absolute inset-0 w-full h-full bg-role-primary/50 animate-[shimmer_2s_infinite]" />
            </div>
        </div>
    );
}
