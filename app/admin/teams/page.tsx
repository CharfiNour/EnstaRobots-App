"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Key, ListOrdered, UserCircle, WifiOff, AlertTriangle } from 'lucide-react';
import { getTeams, Team } from '@/lib/teams';
import { fetchTeamsFromSupabase } from '@/lib/supabaseData';
import { getSession } from '@/lib/auth';
import { TeamsOrderTab, TeamsProfilesTab } from './components';
import { getCompetitionCategories } from './services/teamsFeatureService';
import { AdminTeamsTab } from './types';
import { supabase } from '@/lib/supabase';

function ConnectionDiagnostics() {
    const [status, setStatus] = useState<'checking' | 'ok' | 'env-missing' | 'connection-failed'>('checking');

    useEffect(() => {
        const check = async () => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!url || !key) {
                setStatus('env-missing');
                return;
            }

            const { error } = await supabase.from('teams').select('count', { count: 'exact', head: true });
            if (error) {
                console.error("DIAGNOSTIC ERROR:", error);
                setStatus('connection-failed');
            } else {
                setStatus('ok');
            }
        };
        check();
    }, []);

    if (status === 'ok' || status === 'checking') return null;

    return (
        <div className="bg-red-500/10 border-b border-red-500/20 p-4 relative z-50">
            <div className="container mx-auto max-w-7xl flex items-center gap-4 text-red-500">
                <WifiOff size={24} />
                <div>
                    <h3 className="font-bold uppercase tracking-widest text-sm">System Malfunction</h3>
                    <p className="text-xs font-mono mt-1">
                        {status === 'env-missing'
                            ? "CRITICAL: Environment variables missing. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
                            : "CONNECTION FAILURE: Unable to reach database node. Check internet connection or credentials."}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTab, setActiveTab] = useState<AdminTeamsTab>('order');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const categories = getCompetitionCategories();

    useEffect(() => {
        const session = getSession();
        // Auth check commented out for dev ease, can restore later
        // if (!session || session.role !== 'admin') router.push('/auth/login');

        const loadTeams = async () => {
            setLoading(true);
            const currentTeams = await fetchTeamsFromSupabase();

            // Defensive: Filter out any remaining dummy/dead data
            const cleanTeams = currentTeams.filter(t => {
                const isDead = (t.name?.toUpperCase() === 'TEAM-42') ||
                    (t.club?.toUpperCase() === 'CLUB UNKNOWN') ||
                    (!t.name && t.isPlaceholder);
                return !isDead;
            });

            setTeams(cleanTeams);
            setLoading(false);
        };
        loadTeams();

        if (activeTab === 'order' && selectedCategory === 'all' && categories.length > 0) {
            setSelectedCategory(categories[0].id);
        }

        window.addEventListener('teams-updated', loadTeams);
        window.addEventListener('storage', (e) => {
            if (e.key === 'enstarobots_teams_v1') loadTeams();
        });

        return () => {
            window.removeEventListener('teams-updated', loadTeams);
            window.removeEventListener('storage', loadTeams);
        };
    }, [activeTab, selectedCategory]);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            <ConnectionDiagnostics />

            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
            </div>

            <div className="container mx-auto px-6 py-8 md:py-12 max-w-7xl relative z-10 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                            <Shield className="w-8 h-8 text-accent" />
                            Team Console
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2">
                            Master control for team registration, ordering, and technical specifications
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 p-1 bg-muted/30 backdrop-blur-md border border-card-border rounded-xl">
                        {[
                            { id: 'order', label: 'Match Order', icon: ListOrdered },
                            { id: 'profiles', label: 'Detailed Profiles', icon: UserCircle }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    if (tab.id === 'order' && selectedCategory === 'all') {
                                        setSelectedCategory(categories[0].id);
                                    }
                                }}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === tab.id
                                    ? 'bg-card text-foreground shadow-xl border border-card-border'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <tab.icon size={12} className={activeTab === tab.id ? 'text-accent' : ''} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-active"
                                        className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === 'order' && (
                        <div className="max-w-4xl mx-auto bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                            {loading && teams.length === 0 ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-12 bg-muted rounded-xl w-full" />
                                    <div className="h-64 bg-muted rounded-2xl w-full" />
                                </div>
                            ) : (
                                <TeamsOrderTab
                                    teams={teams}
                                    setTeams={setTeams}
                                    selectedCategory={selectedCategory}
                                    setSelectedCategory={setSelectedCategory}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'profiles' && (
                        <div>
                            {loading && teams.length === 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                                    <div className="h-96 bg-muted rounded-2xl col-span-1" />
                                    <div className="h-96 bg-muted rounded-2xl col-span-2" />
                                </div>
                            ) : (
                                <TeamsProfilesTab teams={teams} setTeams={setTeams} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tactical Footer Overlay */}
            <div className="fixed bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent z-50 pointer-events-none" />
        </div>
    );
}
