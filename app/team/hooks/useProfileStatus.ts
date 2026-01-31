"use client";

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { fetchTeamsFromSupabase } from '@/lib/supabaseData';

export function useProfileStatus() {
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [clubName, setClubName] = useState<string | null>(null);

    const checkStatus = async () => {
        const session = getSession();
        if (!session || session.role !== 'team') {
            setLoading(false);
            return;
        }

        const teams = await fetchTeamsFromSupabase('minimal');
        const name = session.clubName || teams.find(t => t.id === session.teamId)?.club;
        setClubName(name || null);

        if (!name) {
            setProfileComplete(false);
            setLoading(false);
            return;
        }

        const myTeams = teams.filter(t => t.club === name);

        // A club is "Complete" if it has at least one team that IS NOT a placeholder
        const hasCompletedUnit = myTeams.some(t => !t.isPlaceholder);

        setProfileComplete(hasCompletedUnit);
        setLoading(false);
    };

    useEffect(() => {
        checkStatus();
    }, []);

    return { loading, profileComplete, clubName };
}
