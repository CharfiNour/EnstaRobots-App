import { supabase } from './supabase';
import { Team, TeamMember } from './teams';
import { OfflineScore } from './offlineScores';
import { Database } from '../types/supabase';

type DBTeam = Database['public']['Tables']['teams']['Row'];
type DBTeamMember = Database['public']['Tables']['team_members']['Row'];
type DBScore = Database['public']['Tables']['scores']['Row'];

/**
 * COMPETITIONS SERVICE
 */

export async function fetchCompetitionsFromSupabase() {
    console.log("Supabase URL Check:", process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED' : 'MISSING');
    const { data, error } = await supabase
        .from('competitions')
        .select('*');

    if (error) {
        console.error('Error fetching competitions RAW:', error);
        console.error('Error fetching competitions MSG:', error.message || 'No message');
        return [];
    }
    return data;
}

/**
 * TEAMS SERVICE
 */

export async function fetchTeamsFromSupabase(): Promise<Team[]> {
    const { data, error } = await supabase
        .from('teams')
        .select(`
            *,
            team_members (*)
        `);

    if (error) {
        console.error('Error fetching teams RAW:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name, // Robot name in DB
        robotName: t.robot_name || t.name,
        club: t.club || '',
        university: t.university || '',
        logo: t.logo_url || '',
        photo: t.photo_url || '',
        code: t.code || '',
        competition: t.competition_id || '',
        isPlaceholder: t.is_placeholder,
        visualsLocked: t.visuals_locked,
        members: (t.team_members || []).map((m: DBTeamMember) => ({
            name: m.name,
            role: m.role || '',
            isLeader: m.is_leader
        }))
    }));
}

export async function upsertTeamToSupabase(team: Team) {
    // 1. Upsert Team
    const { error: teamError } = await (supabase.from('teams') as any)
        .upsert({
            id: team.id.startsWith('slot-') || team.id.startsWith('club-') ? undefined : team.id,
            name: team.name,
            robot_name: team.robotName || team.name,
            club: team.club,
            university: team.university,
            logo_url: team.logo,
            photo_url: team.photo,
            code: team.code,
            competition_id: team.competition,
            is_placeholder: team.isPlaceholder,
            visuals_locked: team.visualsLocked
        });

    if (teamError) throw teamError;

    // 2. Refresh Members
    // Note: We use the team ID. For new teams (slots), we might need to fetch the generated UUID first
    // but here we assume the team.id passed is the one to use if not a temporary slot ID.
    if (!team.id.startsWith('slot-') && !team.id.startsWith('club-')) {
        await (supabase.from('team_members') as any).delete().eq('team_id', team.id);

        if (team.members.length > 0) {
            const { error: memberError } = await (supabase.from('team_members') as any)
                .insert(team.members.map(m => ({
                    team_id: team.id,
                    name: m.name,
                    role: m.role,
                    is_leader: m.isLeader || false
                })));
            if (memberError) throw memberError;
        }
    }
}

/**
 * SCORES SERVICE
 */

export async function fetchScoresFromSupabase(): Promise<OfflineScore[]> {
    const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('--- SUPABASE FETCH ERROR ---');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        return [];
    }

    return (data || []).map((s: any) => ({
        id: s.id,
        matchId: s.match_id || '',
        teamId: s.team_id,
        competitionType: s.competition_id || '',
        phase: s.phase || '',
        timeMs: s.time_ms ?? undefined,
        bonusPoints: s.bonus_points ?? undefined,
        completed_road: s.completed_road ?? undefined,
        knockouts: s.knockouts ?? undefined,
        juryPoints: s.judge_points ?? undefined,
        damageScore: s.damage_score ?? undefined,
        totalPoints: s.total_points,
        juryId: s.judge_id || '',
        timestamp: new Date(s.created_at || Date.now()).getTime(),
        synced: true,
        isSentToTeam: s.is_sent_to_team,
        status: s.status || undefined
    }));
}

export async function pushScoreToSupabase(score: OfflineScore) {
    const scoreData: any = {
        id: score.id && !score.id.startsWith('offline-') ? score.id : undefined,
        team_id: String(score.teamId),
        competition_id: score.competitionType ? String(score.competitionType) : null,
        phase: score.phase || 'qualifications',
        match_id: score.matchId ? String(score.matchId) : null,
        time_ms: score.timeMs ?? null,
        bonus_points: score.bonusPoints ?? null,
        completed_road: (score as any).completedRoad ?? (score as any).completed_road ?? null,
        knockouts: score.knockouts ?? null,
        judge_points: score.juryPoints ?? null,
        damage_score: score.damageScore ?? null,
        total_points: score.totalPoints || 0,
        judge_id: score.juryId && score.juryId !== '' ? String(score.juryId) : null,
        status: score.status || 'pending',
        is_sent_to_team: !!score.isSentToTeam,
        created_at: new Date(score.timestamp || Date.now()).toISOString()
    };

    const { error } = await (supabase.from('scores') as any).upsert(scoreData);

    if (error) {
        console.group('--- SUPABASE PUSH ERROR ---');
        console.error('Status:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.log('Object:', error);
        console.log('Attempted Data:', scoreData);
        console.groupEnd();
        throw error;
    }
}

export async function deleteScoreFromSupabase(scoreId: string) {
    const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', scoreId);

    if (error) {
        console.error('Error deleting score from Supabase:', error);
        throw error;
    }
}

export async function clearAllScoresFromSupabase() {
    const { error } = await supabase
        .from('scores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (error) {
        console.error('Error clearing all scores:', error);
        throw error;
    }
}

/**
 * LIVE STATE SERVICE
 */

export async function syncLiveStateToSupabase(sessions: Record<string, any>) {
    try {
        const sessionEntries = Object.entries(sessions).map(([compId, sub]) => ({
            competition_id: String(compId),
            team_id: String(sub.teamId),
            phase: sub.phase || '',
            start_time: new Date(sub.startTime || Date.now()).toISOString()
        }));

        if (sessionEntries.length > 0) {
            // Use upsert to be robust against race conditions
            const { error: insertError } = await (supabase.from('live_sessions') as any)
                .upsert(sessionEntries, { onConflict: 'competition_id,team_id' });

            if (insertError) {
                console.group('--- SUPABASE LIVE SYNC ERROR ---');
                console.error('Code:', insertError.code);
                console.error('Message:', insertError.message);
                console.log('Attempted Data:', sessionEntries);
                console.groupEnd();
            }
        }
    } catch (e) {
        console.error("Critical error in syncLiveStateToSupabase:", e);
    }
}

export async function deleteLiveSessionFromSupabase(competitionId: string) {
    try {
        const { error } = await supabase
            .from('live_sessions')
            .delete()
            .eq('competition_id', competitionId);

        if (error) {
            console.error('Error deleting live session from Supabase:', error);
        }
    } catch (e) {
        console.error("Critical error in deleteLiveSessionFromSupabase:", e);
    }
}

export async function clearAllLiveSessionsFromSupabase() {
    try {
        const { error } = await supabase
            .from('live_sessions')
            .delete()
            .neq('competition_id', '00000000-0000-0000-0000-000000000001'); // Delete all

        if (error) {
            console.error('Error clearing all live sessions from Supabase:', error);
        }
    } catch (e) {
        console.error("Critical error in clearAllLiveSessionsFromSupabase:", e);
    }
}

export async function fetchLiveSessionsFromSupabase(): Promise<Record<string, any>> {
    const { data, error } = await supabase
        .from('live_sessions')
        .select('*');

    if (error) {
        console.group('--- SUPABASE LIVE FETCH ERROR ---');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.groupEnd();
        return {};
    }

    const sessions: Record<string, any> = {};
    data?.forEach((s: any) => {
        sessions[s.competition_id] = {
            teamId: s.team_id,
            phase: s.phase,
            startTime: new Date(s.start_time).getTime()
        };
    });

    return sessions;
}
