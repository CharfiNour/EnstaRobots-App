"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Key, ListOrdered, UserCircle } from 'lucide-react';
import { getTeams, Team } from '@/lib/teams';
import { getSession } from '@/lib/auth';
import { TeamsCodesTab, TeamsOrderTab, TeamsProfilesTab } from './components';
import { getCompetitionCategories } from './services/teamsFeatureService';
import { AdminTeamsTab } from './types';

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTab, setActiveTab] = useState<AdminTeamsTab>('codes');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const router = useRouter();
    const categories = getCompetitionCategories();

    useEffect(() => {
        const session = getSession();
        if (!session || session.role !== 'admin') {
            // Uncomment to enforce admin
            // router.push('/auth/login');
        }
        const currentTeams = getTeams();
        setTeams(currentTeams);

        if (activeTab === 'order' && selectedCategory === 'all') {
            setSelectedCategory(categories[0].id);
        }
    }, [selectedCategory, activeTab, categories]);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
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
                            { id: 'codes', label: 'Security Codes', icon: Key },
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
                    {activeTab === 'codes' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                            <TeamsCodesTab teams={teams} setTeams={setTeams} />
                        </motion.div>
                    )}

                    {activeTab === 'order' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                            <TeamsOrderTab
                                teams={teams}
                                setTeams={setTeams}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'profiles' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <TeamsProfilesTab teams={teams} setTeams={setTeams} />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Tactical Footer Overlay */}
            <div className="fixed bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent z-50 pointer-events-none" />
        </div>
    );
}
