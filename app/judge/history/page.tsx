"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    History
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';

export default function JudgeHistoryPage() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'judge') {
            router.push('/auth/judge');
            return;
        }
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Archive...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 flex flex-col pb-6">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Dashboard Header */}
            <header className="px-10 py-8 flex items-center justify-between relative z-20 shrink-0">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-2xl shadow-accent/40 group hover:scale-105 transition-all duration-500">
                        <History size={32} className="text-slate-900 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none flex items-center gap-3">
                            Judge Console
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm font-medium tracking-tight opacity-70">
                            Performance records & telemetry history verification.
                        </p>
                    </div>
                </motion.div>
            </header>

            <div className="flex-1 relative z-10 px-6 w-full max-w-[1700px] mx-auto">
                <ScoreHistoryView />
            </div>
        </div>
    );
}
