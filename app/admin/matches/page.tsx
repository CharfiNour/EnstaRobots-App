"use client";

import { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { Team, saveTeams } from '@/lib/teams';
import { fetchTeamsFromSupabase } from '@/lib/supabaseData';
import TeamsCodesTab from '../teams/components/TeamsCodesTab';
import StaffCodesTab from './components/StaffCodesTab';

export default function AdminCodesPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const currentTeams = await fetchTeamsFromSupabase();
            setTeams(currentTeams);
            setLoading(false);
        };
        load();
    }, []);

    const handleSetTeams = (updatedTeams: Team[]) => {
        setTeams(updatedTeams);
        saveTeams(updatedTeams);
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col py-10 md:py-16">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                            <Key className="w-8 h-8 text-accent" />
                            Security Protocol Center
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2 italic">
                            Cryptographic key management for team registration and terminal access control
                        </p>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Staff Codes Section */}
                    <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/20 via-accent/20 to-amber-500/20" />
                        <StaffCodesTab />
                    </div>

                    {/* Team Codes Section */}
                    <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                        {loading && teams.length === 0 ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-12 bg-muted rounded-xl w-full" />
                                <div className="h-64 bg-muted rounded-2xl w-full" />
                            </div>
                        ) : (
                            <TeamsCodesTab teams={teams} setTeams={handleSetTeams} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
