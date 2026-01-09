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

            {/* Refined Admin Header */}
            <header className="relative z-10 p-6 md:p-8 pt-10">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase italic flex items-center gap-4">
                                <Shield className="w-12 h-12 text-role-primary" />
                                Sc<span className="text-role-primary">ore</span> Registry
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3 opacity-60 flex items-center gap-2">
                                <Terminal size={14} className="text-role-primary" />
                                Master record authority with elevated data permissions
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-2 bg-role-primary/10 px-4 py-2 rounded-xl border border-role-primary/20 shadow-sm">
                                <Activity size={16} className="text-role-primary animate-pulse" />
                                <span className="text-[11px] text-role-primary font-black tracking-widest uppercase italic">Operational Sync Active</span>
                            </span>
                        </div>
                    </div>
                </div>
            </header>

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
