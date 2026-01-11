"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key } from 'lucide-react';
import { getTeams, Team, saveTeams } from '@/lib/teams';
import TeamsCodesTab from '../teams/components/TeamsCodesTab';
import StaffCodesTab from './components/StaffCodesTab';

export default function AdminCodesPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentTeams = getTeams();
        setTeams(currentTeams);
        setLoading(false);
    }, []);

    const handleSetTeams = (updatedTeams: Team[]) => {
        setTeams(updatedTeams);
        saveTeams(updatedTeams);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/20 via-accent/20 to-amber-500/20" />
                        <StaffCodesTab />
                    </motion.div>

                    {/* Team Codes Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                        <TeamsCodesTab teams={teams} setTeams={handleSetTeams} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
