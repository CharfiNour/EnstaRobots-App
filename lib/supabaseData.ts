import { supabase } from './supabase';
import { Team, TeamMember } from './teams';
import { OfflineScore } from './offlineScores';
import { Database } from '../types/supabase';

type DBTeam = Database['public']['Tables']['teams']['Row'];
type DBTeamMember = Database['public']['Tables']['team_members']['Row'];
type DBScore = Database['public']['Tables']['scores']['Row'];

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
        console.error('Error fetching teams:', error);
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
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching scores:', error);
        return [];
    }

    return (data || []).map((s: DBScore) => ({
        id: s.id,
        matchId: s.match_id || '',
        teamId: s.team_id,
        competitionType: s.competition_id || '',
        phase: s.phase || '',
        timeMs: s.time_ms ?? undefined,
        bonusPoints: s.bonus_points ?? undefined,
        completed_road: s.completed_road ?? undefined,
        knockouts: s.knockouts ?? undefined,
        judgePoints: s.judge_points ?? undefined,
        damageScore: s.damage_score ?? undefined,
        totalPoints: s.total_points,
        judgeId: s.judge_id || '',
        timestamp: new Date(s.timestamp).getTime(),
        synced: true,
        isSentToTeam: s.is_sent_to_team,
        status: s.status || undefined
    }));
}

export async function pushScoreToSupabase(score: OfflineScore) {
    const scoreData: any = {
        id: score.id.startsWith('offline-') ? undefined : score.id,
        team_id: score.teamId,
        competition_id: score.competitionType,
        phase: score.phase ?? null,
        match_id: score.matchId,
        time_ms: score.timeMs ?? null,
        bonus_points: score.bonusPoints ?? null,
        completed_road: score.completedRoad ?? null,
        knockouts: score.knockouts ?? null,
        judge_points: score.judgePoints ?? null,
        damage_score: score.damageScore ?? null,
        total_points: score.totalPoints,
        judge_id: score.judgeId,
        status: score.status ?? null,
        is_sent_to_team: score.isSentToTeam ?? false,
        timestamp: new Date(score.timestamp).toISOString()
    };

    const { error } = await (supabase.from('scores') as any).upsert(scoreData);

    if (error) throw error;
}

/**
 * LIVE STATE SERVICE
 */

export async function syncLiveStateToSupabase(sessions: Record<string, any>) {
    // Delete existing sessions
    await (supabase.from('live_sessions') as any).delete().neq('competition_id', 'none');

    const sessionEntries = Object.entries(sessions).map(([compId, sub]) => ({
        competition_id: compId,
        team_id: sub.teamId,
        phase: sub.phase,
        start_time: new Date(sub.startTime).toISOString()
    }));

    if (sessionEntries.length > 0) {
        const { error } = await (supabase.from('live_sessions') as any).insert(sessionEntries);
        if (error) console.error('Error syncing live sessions:', error);
    }
}
