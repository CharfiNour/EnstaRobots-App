"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, ListOrdered, UserCircle } from 'lucide-react';
import { getTeams, Team } from '@/lib/teams';
import { getSession } from '@/lib/auth';
import TeamsCodesTab from './components/TeamsCodesTab';
import TeamsOrderTab from './components/TeamsOrderTab';
import TeamsProfilesTab from './components/TeamsProfilesTab';

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'fight', name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTab, setActiveTab] = useState<'codes' | 'order' | 'profiles'>('codes');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const router = useRouter();

    useEffect(() => {
        const session = getSession();
        if (!session || session.role !== 'admin') {
            // Uncomment to enforce admin
            // router.push('/auth/login');
        }
        const currentTeams = getTeams();
        setTeams(currentTeams);

        if (activeTab === 'order' && selectedCategory === 'all') {
            setSelectedCategory(COMPETITION_CATEGORIES[0].id);
        }
    }, [selectedCategory, activeTab]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 italic">
                            <Shield className="w-8 h-8 text-accent" />
                            TEAM CONSOLE
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm font-medium tracking-tight">
                            Master control for team registration, ordering, and technical specifications.
                        </p>
                    </div>
                </div>

                {/* Tabs Wrapper */}
                <div className="flex flex-wrap gap-2 p-1 bg-muted/50 border border-card-border w-fit rounded-xl mb-8">
                    {[
                        { id: 'codes', label: 'Teams Codes', icon: Key },
                        { id: 'order', label: 'Teams Order', icon: ListOrdered },
                        { id: 'profiles', label: 'Profiles', icon: UserCircle }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                if (tab.id === 'order' && selectedCategory === 'all') {
                                    setSelectedCategory(COMPETITION_CATEGORIES[0].id);
                                }
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-card text-foreground shadow-lg border border-card-border'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[700px]">
                    {activeTab === 'codes' && (
                        <div className="max-w-[70%] mx-auto bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-6 lg:p-8 shadow-2xl">
                            <TeamsCodesTab teams={teams} setTeams={setTeams} />
                        </div>
                    )}

                    {activeTab === 'order' && (
                        <div className="max-w-[70%] mx-auto bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-6 lg:p-8 shadow-2xl">
                            <TeamsOrderTab
                                teams={teams}
                                setTeams={setTeams}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                            />
                        </div>
                    )}

                    {activeTab === 'profiles' && (
                        <TeamsProfilesTab teams={teams} setTeams={setTeams} />
                    )}
                </div>
            </div>
        </div>
    );
}
