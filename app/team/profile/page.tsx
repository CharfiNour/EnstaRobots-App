"use client";

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { getTeams, Team } from '@/lib/teams';
import { useRouter } from 'next/navigation';
import TeamProfileView from '../components/TeamProfileView';

export default function TeamProfilePage() {
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const router = useRouter();

    const refreshData = () => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);

        const allTeams = getTeams();
        const currentTeam = allTeams.find(t => String(t.id) === String(currentSession.teamId));
        if (currentTeam) {
            setTeam(currentTeam);
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-transparent">
            <div className="container mx-auto px-4 py-8 md:py-12 relative z-10 max-w-6xl">
                <TeamProfileView
                    team={team}
                    onUpdate={(updated) => setTeam(updated)}
                    isAdmin={false} // Only admin can edit now
                />
            </div>
        </div>
    );
}
